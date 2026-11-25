/**
 * The payment paths with the providers faked — no database, no network:
 *   npx ts-node src/controllers/payment/payment.controller.check.ts
 * QPay's paid amount against the invoice, Stripe sessions that must not pass (unpaid, another
 * booking's), webhook signatures, and the simulated fallback. BookingController.settle is replaced by
 * a recorder; the booking check covers the real one.
 */
import assert from 'node:assert/strict';
import Stripe from 'stripe';

import { BookingModel } from '../../models/booking/booking.model';
import BookingController from '../booking/booking.controller';
import PaymentController from './payment.controller';

const settled: { id: string; refs?: object }[] = [];
BookingController.settle = async (id, refs) => {
  settled.push({ id, refs });
  return null;
};
BookingController.findIdCheck = async (id) => ({ id }) as never;

const booking = (fields: object) =>
  ({ id: 'b-1', code: 'ITR-ABC123', status: 'PENDING_PAYMENT', totalUsd: 100, ...fields }) as BookingModel;

const main = async () => {
  // —— QPay: 100 USD = ₮350,000; only PAID rows count, and they must reach the invoice ——
  assert.equal(
    PaymentController.qpayPaid({
      count: 3,
      rows: [
        { payment_status: 'PAID', payment_amount: '200000.00' },
        { payment_status: 'FAILED', payment_amount: '150000.00' },
        { payment_status: 'PAID', payment_amount: 100000 }
      ]
    }),
    300000
  );
  assert.equal(PaymentController.qpayPaid({ count: 0, rows: [] }), 0);

  PaymentController.qpayOn = true;
  const calls: { url: string; init: RequestInit }[] = [];
  let paid = '349999.00';
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const body = url.endsWith('/v2/auth/token')
      ? { access_token: 'tok', expires_in: Math.floor(Date.now() / 1000) + 86400 }
      : { count: 1, rows: [{ payment_id: 'pay-9', payment_status: 'PAID', payment_amount: paid }] };
    return new Response(JSON.stringify(body), { status: 200 });
  }) as typeof fetch;

  const qpay = booking({ method: 'QPAY', qpayInvoiceId: 'inv-1' });
  await PaymentController.check(qpay);
  assert.equal(settled.length, 0, 'a tögrög short is not paid');
  assert.match(String((calls[0].init.headers as Record<string, string>).authorization), /^Basic /);
  assert.equal((calls[1].init.headers as Record<string, string>).authorization, 'Bearer tok');
  assert.deepEqual(JSON.parse(String(calls[1].init.body)), {
    object_type: 'INVOICE',
    object_id: 'inv-1',
    offset: { page_number: 1, page_limit: 100 }
  });
  paid = '350000.00';
  await PaymentController.check(qpay);
  assert.deepEqual(settled.pop(), { id: 'b-1', refs: { paymentRef: 'pay-9' } });
  assert.equal(calls.filter((call) => call.url.endsWith('/token')).length, 1, 'the token is reused');
  // a booking that is no longer pending is never asked about
  await PaymentController.check(booking({ method: 'QPAY', qpayInvoiceId: 'inv-1', status: 'PAID' }));
  assert.equal(calls.length, 3);

  // —— Stripe: paid and for this booking, or nothing ——
  const stripe = new Stripe('sk_test_fake');
  PaymentController.stripe = stripe;
  const session = (fields: object) =>
    ({ id: 'cs_1', payment_status: 'paid', payment_intent: 'pi_1', metadata: { bookingId: 'b-1' }, ...fields }) as unknown as Stripe.Checkout.Session;
  let next = session({ payment_status: 'unpaid' });
  stripe.checkout.sessions.retrieve = (async () => next) as never;
  const card = booking({ method: 'CARD', stripeSessionId: 'cs_1' });
  await PaymentController.check(card);
  next = session({ metadata: { bookingId: 'someone-else' } });
  await PaymentController.check(card, 'cs_other');
  assert.equal(settled.length, 0, 'unpaid or mismatched sessions are refused');
  next = session({});
  await PaymentController.check(card, 'cs_1');
  assert.deepEqual(settled.pop(), { id: 'b-1', refs: { stripeSessionId: 'cs_1', paymentRef: 'pi_1' } });

  // —— the webhook: only a body signed with our secret is believed ——
  PaymentController.webhookSecret = 'whsec_test';
  const payload = JSON.stringify({
    id: 'evt_1',
    object: 'event',
    type: 'checkout.session.completed',
    data: { object: session({ object: 'checkout.session' }) }
  });
  const sign = (secret: string) => stripe.webhooks.generateTestHeaderString({ payload, secret });
  await assert.rejects(PaymentController.stripeWebhook(Buffer.from(payload), sign('whsec_wrong')), {
    type: 'StripeSignatureVerificationError'
  });
  await assert.rejects(
    PaymentController.stripeWebhook(Buffer.from(payload.replace('pi_1', 'pi_2')), sign('whsec_test')),
    { type: 'StripeSignatureVerificationError' }
  );
  await assert.rejects(PaymentController.stripeWebhook(Buffer.from(payload), undefined), {
    type: 'StripeSignatureVerificationError'
  });
  assert.equal(settled.length, 0);
  await PaymentController.stripeWebhook(Buffer.from(payload), sign('whsec_test'));
  assert.deepEqual(settled.pop(), { id: 'b-1', refs: { stripeSessionId: 'cs_1', paymentRef: 'pi_1' } });

  // —— no keys: simulated, paid at once; a transfer still waits ——
  PaymentController.qpayOn = false;
  PaymentController.stripe = null;
  await PaymentController.start(booking({ method: 'CARD' }) as never);
  await PaymentController.start(booking({ method: 'QPAY' }) as never);
  assert.equal(settled.length, 2);
  settled.length = 0;
  await PaymentController.start(booking({ method: 'BANK' }) as never);
  assert.equal(settled.length, 0);

  console.log('payment.controller.check ✓');
  process.exit(0);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
