import { Router } from 'express';
import exportRouter from './export.route';
import fileRouter from './file.route';
import paymentRouter from './payment.route';

/**
 * GraphQL is the API. REST lives here only for what GraphQL can't carry: /upload (plan photos),
 * /export/orders (a CSV file) and the payment providers' callbacks (/payments/…). Each route brings
 * its own body parser; express.json() is only on /graphql.
 */
const router = Router();

router.get('/health', (_req, res) => {
  res.json({ ok: true });
});

router.use('/', fileRouter);
router.use('/', exportRouter);
router.use('/', paymentRouter);

export default router;
