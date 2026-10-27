import { Router } from 'express';
import exportRouter from './export.route';
import fileRouter from './file.route';

/**
 * GraphQL is the API. REST lives here only for what GraphQL can't carry: /upload (plan photos) and
 * /export/orders (a CSV file). Each route brings its own body parser; express.json() is only on
 * /graphql.
 */
const router = Router();

router.get('/health', (_req, res) => {
  res.json({ ok: true });
});

router.use('/', fileRouter);
router.use('/', exportRouter);

export default router;
