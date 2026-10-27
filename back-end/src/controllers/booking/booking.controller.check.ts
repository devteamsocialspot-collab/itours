/**
 * The one check for selling seats, against the dev database:
 *   npx ts-node src/controllers/booking/booking.controller.check.ts
 * Makes a throwaway agency with a 3-seat departure, lets six travellers race for it, and deletes
 * everything it made (bookings first: they RESTRICT; the operator cascades to its plan).
 */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

import { connectDatabase } from '../../config/database';
import { BookingModel } from '../../models/booking/booking.model';
import { OperatorModel } from '../../models/operator/operator.model';
import { DepartureModel } from '../../models/plan/departure.model';
import { PlanModel } from '../../models/plan/plan.model';
import { UserModel } from '../../models/user/user.model';
import { PAY_METHOD, ROOM } from '../../types/booking/booking.type';
import { PLAN_STATUS } from '../../types/plan/plan.type';
import { ROLES } from '../../types/user/role.type';
import { addDays, todayUb } from '../../utils';
import BookingController from './booking.controller';

const main = async () => {
  await connectDatabase();
  const stamp = Date.now();
  const operator = await OperatorModel.create({
    slug: `booking-check-${stamp}`,
    name: 'booking check',
    isVerified: true
  });
  const travellers = await Promise.all(
    Array.from({ length: 6 }, (_, i) =>
      UserModel.create({
        email: `booking-check-${stamp}-${i}@example.com`,
        name: 'booking check',
        password: randomUUID(),
        role: ROLES.USER
      })
    )
  );
  try {
    const plan = await PlanModel.create({
      operatorId: operator.id,
      slug: `booking-check-${stamp}`,
      titleEn: 'booking check',
      days: 3,
      maxGroup: 6,
      priceUsd: 1000,
      groupPriceUsd: 900,
      groupPriceFrom: 3,
      singleSupplement: 100,
      freeCancelDays: 21,
      status: PLAN_STATUS.PUBLISHED
    });
    const departure = await DepartureModel.create({
      planId: plan.id,
      startDate: addDays(todayUb(), 60),
      seats: 3
    });
    const book = (userId: string, pax = 1, extra = {}) =>
      BookingController.createBooking(
        {
          planId: plan.id,
          departureId: departure.id,
          pax,
          room: ROOM.TWIN,
          method: PAY_METHOD.CARD,
          notes: '',
          accept: true,
          ...extra
        },
        userId
      );

    // not reading the cons is refused before any seat is touched
    await assert.rejects(book(travellers[0].id, 1, { accept: false }), /mustAcceptTradeoffs/);

    // six travellers race for three seats: exactly three get one, the rest are told it is full
    const results = await Promise.allSettled(travellers.map((user) => book(user.id)));
    const sold = results.filter((result) => result.status === 'fulfilled');
    assert.equal(sold.length, 3);
    for (const result of results)
      if (result.status === 'rejected') assert.match(result.reason.message, /notEnoughSeats/);
    assert.equal(await BookingModel.sum('pax', { where: { departureId: departure.id } }), 3);

    // the price comes from the plan, never the form; group price from 3, single supplement per head
    const trip = (sold[0] as PromiseFulfilledResult<Awaited<ReturnType<typeof book>>>).value;
    assert.equal(trip.totalUsd, 1000);
    assert.equal(BookingController.unitPrice(plan, 3), 900);
    assert.equal(BookingController.unitPrice(plan, 2), 1000);

    // a cancelled seat goes back on sale
    await BookingController.cancelBooking(trip.id, trip.userId);
    const late = await book(travellers.find((user) => user.id !== trip.userId)!.id);
    assert.equal(late.status, 'PAID');

    // dates and money for the confirmation page: 3 days, 5% kept, free cancel until 21 days before
    assert.equal(BookingController.lastDay(late), addDays(departure.startDate, 2));
    assert.equal(BookingController.payout(late).usd, 950);
    assert.equal(BookingController.payout(late).date, addDays(departure.startDate, 3));
    assert.equal(BookingController.freeCancelUntil(late), addDays(departure.startDate, -21));
    assert.equal(BookingController.stage(late), 'PAID');
    assert.equal(BookingController.canReview(late), false);
  } finally {
    await BookingModel.destroy({ where: { userId: travellers.map((user) => user.id) } });
    await UserModel.destroy({ where: { id: travellers.map((user) => user.id) } });
    await operator.destroy();
  }
  console.log('booking.controller.check ✓');
  process.exit(0);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
