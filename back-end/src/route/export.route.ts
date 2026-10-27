import { Router } from 'express';
import BookingController from '../controllers/booking/booking.controller';
import UserController from '../controllers/user/user.controller';
import { ROLES } from '../types/user/role.type';
import { pickLocale, t } from '../utils/i18n';

/** An agency's orders as a CSV file, with the same bearer token as GraphQL. */
const router = Router();

router.get('/export/orders', async (req, res) => {
  const lang = pickLocale(req.headers);
  try {
    const { userId, userRole, authError } = await UserController.verifyJwt(
      req.headers.authorization
    );
    if (!userId) throw new Error(authError);
    if (userRole !== ROLES.OPERATOR) throw new Error('error.forbidden');
    const operatorId = await UserController.operatorIdOf(userId);
    res
      .type('text/csv; charset=utf-8')
      .attachment('itours-orders.csv')
      .send(await BookingController.exportCsv(operatorId));
  } catch (error) {
    res.status(403).json({ success: false, message: t(error.message, lang) });
  }
});

export default router;
