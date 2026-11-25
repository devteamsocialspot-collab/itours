import Stripe from 'stripe';
import config from '../../config';
import { BookingModel } from '../../models/booking/booking.model';
import { BOOKING_STATUS, PAY_METHOD, TQpayBank } from '../../types/booking/booking.type';
import BookingController from '../booking/booking.controller';

const {
  MNT_PER_USD,
  ONLINE_HOLD_MINUTES,
  QPAY_BASE_URL,
  QPAY_USERNAME,
  QPAY_PASSWORD,
  QPAY_INVOICE_CODE,
  QPAY_CALLBACK_URL,
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
  SITE_URL
} = config;

type Trip = Awaited<ReturnType<typeof BookingController.findIdCheck>>;

/** POST /v2/payment/check's answer. QPay documents `count` and `rows`; each row is one payment. */
type QpayCheck = {
  count?: number;
  rows?: { payment_id?: string; payment_status?: string; payment_amount?: string | number }[];
};

let qpayToken = { value: '', until: 0 };

/**
 * Real money: QPay (v2 merchant API, plain fetch) for travellers paying from Mongolia, Stripe Checkout
 * for cards from abroad. A provider without its keys is simulated: its bookings are paid at once, as
 * in the demo. Nothing a browser or a callback says is believed — "paid" is always asked of the
 * provider, and BookingController.settle() takes it, once.
 */
export default class PaymentController {
  // static fields, not consts: the payment check swaps them for fakes
  static qpayOn = Boolean(QPAY_USERNAME && QPAY_PASSWORD && QPAY_INVOICE_CODE);
  static stripe: Stripe | null = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;
  static webhookSecret = STRIPE_WEBHOOK_SECRET;

  /** The one line the API prints at boot. */
  static mode() {
    const stripe = !this.stripe
      ? 'simulated (STRIPE_SECRET_KEY unset)'
      : this.webhookSecret
        ? 'live'
        : 'live, webhook off (STRIPE_WEBHOOK_SECRET unset)';
    return `💳 payments: QPay ${this.qpayOn ? `live (${QPAY_BASE_URL})` : 'simulated (QPAY_* unset)'} · Stripe ${stripe}`;
  }

  static mntOf(booking: Pick<BookingModel, 'totalUsd'>) {
    return Math.round(booking.totalUsd * MNT_PER_USD);
  }

  /**
   * Right after the seats are held: a QPay invoice or a Stripe Checkout page, or — simulated — paid
   * at once. A bank transfer waits for the operator. If the provider fails, the booking is deleted
   * (no money moved, its seats free at once) and the traveller is told to try again.
   */
  static async start(booking: Trip) {
    if (booking.method === PAY_METHOD.BANK) return booking;
    const live = booking.method === PAY_METHOD.QPAY ? this.qpayOn : Boolean(this.stripe);
    if (!live) await BookingController.settle(booking.id);
    else
      try {
        if (booking.method === PAY_METHOD.QPAY) await this._qpayInvoice(booking);
        else await this._stripeSession(booking);
      } catch (error) {
        console.error(`⛔ ${booking.method} for ${booking.code}: ${error.message}`);
        await booking.destroy();
        throw new Error('error.paymentUnavailable');
      }
    return BookingController.findIdCheck(booking.id);
  }

  /** "Has it been paid?" for a pending QPay or card booking — the poll, the button, the callback, the return from Stripe. */
  static async check(booking: BookingModel, sessionId?: string) {
    if (booking.status !== BOOKING_STATUS.PENDING_PAYMENT) return;
    if (booking.method === PAY_METHOD.QPAY && this.qpayOn && booking.qpayInvoiceId) {
      const check: QpayCheck = await this._qpay('/v2/payment/check', {
        object_type: 'INVOICE',
        object_id: booking.qpayInvoiceId,
        offset: { page_number: 1, page_limit: 100 }
      });
      if (this.qpayPaid(check) >= this.mntOf(booking))
        await BookingController.settle(booking.id, {
          paymentRef: (check.rows ?? [])
            .filter((row) => row.payment_status === 'PAID')
            .map((row) => row.payment_id)
            .join(',')
        });
    }
    // a session id from the browser only says which session to ask about; its metadata must name this booking
    const id = sessionId || booking.stripeSessionId;
    if (booking.method === PAY_METHOD.CARD && this.stripe && id) {
      const session = await this.stripe.checkout.sessions.retrieve(id);
      if (this.stripePaid(session, booking.id)) await this._settleStripe(session);
    }
  }

  /** The traveller's own pending booking, checked, as the trip page shows it. */
  static async checkMine(code: string, userId: string, sessionId?: string) {
    const booking = await BookingModel.findOne({ where: { code, userId } });
    if (!booking) throw new Error('error.bookingNotFound');
    await this.check(booking, sessionId);
    return BookingController.findIdCheck(booking.id);
  }

  // —— QPay ——

  /** Tögrög the PAID payments of a check add up to. */
  static qpayPaid(check: QpayCheck) {
    return (check.rows ?? [])
      .filter((row) => row.payment_status === 'PAID')
      .reduce((sum, row) => sum + Number(row.payment_amount ?? 0), 0);
  }

  /** One merchant API call. The token is kept until a minute before it expires. */
  static async _qpay(path: string, body: object): Promise<any> {
    if (Date.now() >= qpayToken.until) {
      const res = await fetch(`${QPAY_BASE_URL}/v2/auth/token`, {
        method: 'POST',
        headers: {
          authorization: `Basic ${Buffer.from(`${QPAY_USERNAME}:${QPAY_PASSWORD}`).toString('base64')}`
        }
      });
      if (!res.ok) throw new Error(`QPay token: ${res.status} ${await res.text()}`);
      const token = (await res.json()) as { access_token: string; expires_in: number };
      // QPay documents expires_in as an instant (unix seconds); a plain lifetime is read as one too
      const until = token.expires_in > 1e9 ? token.expires_in * 1000 : Date.now() + token.expires_in * 1000;
      qpayToken = { value: token.access_token, until: until - 60_000 };
    }
    const res = await fetch(`${QPAY_BASE_URL}${path}`, {
      method: 'POST',
      headers: { authorization: `Bearer ${qpayToken.value}`, 'content-type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`QPay ${path}: ${res.status} ${await res.text()}`);
    return res.json();
  }

  static async _qpayInvoice(booking: Trip) {
    const callback = new URL(QPAY_CALLBACK_URL);
    callback.searchParams.set('booking', booking.code);
    const invoice = await this._qpay('/v2/invoice', {
      invoice_code: QPAY_INVOICE_CODE,
      sender_invoice_no: booking.code,
      invoice_receiver_code: booking.userId,
      // no special characters allowed here
      invoice_description: `itours ${booking.code.replace(/\W/g, '')}`,
      amount: this.mntOf(booking),
      callback_url: callback.toString()
    });
    await booking.update({
      qpayInvoiceId: invoice.invoice_id,
      payLink: {
        qrImage: invoice.qr_image,
        shortUrl: invoice.qPay_shortUrl,
        banks: (invoice.urls ?? []) as TQpayBank[]
      }
    });
  }

  // —— Stripe ——

  static stripePaid(session: Stripe.Checkout.Session, bookingId: string) {
    return session.payment_status === 'paid' && session.metadata?.bookingId === bookingId;
  }

  static _settleStripe(session: Stripe.Checkout.Session) {
    const intent = session.payment_intent;
    return BookingController.settle(session.metadata!.bookingId, {
      stripeSessionId: session.id,
      paymentRef: typeof intent === 'string' ? intent : (intent?.id ?? null)
    });
  }

  static async _stripeSession(booking: Trip) {
    const session = await this.stripe!.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(booking.totalUsd * 100),
            product_data: { name: `${booking.plan.titleEn} · ${booking.pax} pax · ${booking.code}` }
          }
        }
      ],
      metadata: { bookingId: booking.id },
      client_reference_id: booking.id,
      customer_email: booking.traveller?.email || undefined,
      // Stripe's floor is 30 minutes: a payment in the last minute lands after the hold, and settle()
      // still takes it while the seats are free
      expires_at: Math.floor(Date.now() / 1000) + Math.max(ONLINE_HOLD_MINUTES + 1, 31) * 60,
      success_url: `${SITE_URL}/trips/${booking.code}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/checkout/${booking.plan.slug}?${new URLSearchParams({
        dep: booking.departureId,
        pax: String(booking.pax),
        room: booking.room,
        cancelled: '1'
      })}`
    });
    await booking.update({ stripeSessionId: session.id, payLink: { url: session.url } });
  }

  /** POST /payments/stripe/webhook. A bad signature throws StripeSignatureVerificationError. */
  static async stripeWebhook(rawBody: Buffer, signature: string | string[] | undefined) {
    const event = this.stripe!.webhooks.constructEvent(rawBody, signature ?? '', this.webhookSecret);
    if (event.type !== 'checkout.session.completed') return;
    const session = event.data.object;
    const bookingId = session.metadata?.bookingId;
    if (bookingId && this.stripePaid(session, bookingId)) await this._settleStripe(session);
  }
}
