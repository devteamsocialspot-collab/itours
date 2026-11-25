import express, { Router } from 'express';
import PaymentController from '../controllers/payment/payment.controller';
import { BookingModel } from '../models/booking/booking.model';

/** What the payment providers call. Both are idempotent: BookingController.settle() takes a payment once. */
const router = Router();

/**
 * Stripe signs the exact bytes it sent, so this route reads the raw body (there is no global JSON
 * parser; express.json() only runs on /graphql). Only checkout.session.completed is acted on.
 */
router.post('/payments/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!PaymentController.stripe || !PaymentController.webhookSecret) {
    res.status(404).end();
    return;
  }
  try {
    await PaymentController.stripeWebhook(req.body, req.headers['stripe-signature']);
    res.json({ received: true });
  } catch (error) {
    // a bad signature is the sender's problem; anything else (the database) is worth Stripe's retry
    const forged = error.type === 'StripeSignatureVerificationError';
    if (!forged) console.error(`⛔ stripe webhook: ${error.message}`);
    res.status(forged ? 400 : 500).json({ received: false });
  }
});

/**
 * QPay calls the invoice's callback_url (…?booking=<code>) once it is paid. Its body is never read:
 * the invoice is checked with QPay again. GET or POST, whichever QPay sends.
 */
router.all('/payments/qpay/callback', async (req, res) => {
  if (!PaymentController.qpayOn) {
    res.status(404).end();
    return;
  }
  try {
    const booking = await BookingModel.findOne({ where: { code: String(req.query.booking ?? '') } });
    if (booking) await PaymentController.check(booking);
    res.send('SUCCESS');
  } catch (error) {
    console.error(`⛔ qpay callback: ${error.message}`);
    res.status(500).send('ERROR');
  }
});

export default router;
