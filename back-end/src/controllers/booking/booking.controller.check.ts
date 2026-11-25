/**
 * The one check for selling seats, against the dev database:
 *   npx ts-node src/controllers/booking/booking.controller.check.ts
 * Makes a throwaway agency with a 3-seat departure, lets six travellers race for it, checks that a
 * transfer hold lapses after 24 hours and a QPay / card hold after 30 minutes, that a payment is
 * taken once, and deletes everything it made (bookings first: they RESTRICT; the operator cascades
 * to its plan). Payments are simulated here whatever .env says: no provider is called.
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
import OperatorController from '../operator/operator.controller';
import PaymentController from '../payment/payment.controller';
import BookingController from './booking.controller';

PaymentController.qpayOn = false;
PaymentController.stripe = null;

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
    // as the createBooking resolver does: hold the seats, then pay (simulated: at once)
    const book = async (userId: string, pax = 1, extra = {}) =>
      PaymentController.start(
        await BookingController.createBooking(
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
        )
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
    assert.equal(BookingController.payBy(late), null);

    // BR-04: a transfer hold keeps its seat for 24 hours, then lapses without anything rewriting it
    const single = await DepartureModel.create({
      planId: plan.id,
      startDate: addDays(todayUb(), 61),
      seats: 1
    });
    const createdAt = new Date(Date.now() - 25 * 3600 * 1000);
    const stale = await BookingModel.create({
      code: `ITR-CHK${String(stamp).slice(-3)}`,
      userId: travellers[0].id,
      planId: plan.id,
      departureId: single.id,
      pax: 1,
      room: ROOM.TWIN,
      totalUsd: 1000,
      method: PAY_METHOD.BANK,
      status: 'PENDING_PAYMENT',
      acceptedTradeoffs: true,
      createdAt
    });
    // the lapsed hold frees its seat for a new buyer, whose own fresh hold then keeps it
    const fresh = await book(travellers[1].id, 1, { departureId: single.id, method: PAY_METHOD.BANK });
    assert.equal(fresh.status, 'PENDING_PAYMENT');
    assert.equal(BookingController.stage(fresh), 'PENDING_PAYMENT');
    assert.equal(
      BookingController.payBy(fresh),
      new Date(fresh.createdAt.getTime() + 24 * 3600 * 1000).toISOString()
    );
    await assert.rejects(book(travellers[2].id, 1, { departureId: single.id }), /notEnoughSeats/);
    // the lapsed one: EXPIRED, not cancellable, its deadline kept, and the transfer can't be marked
    const lapsed = await BookingController.findIdCheck(stale.id);
    assert.equal(BookingController.stage(lapsed), 'EXPIRED');
    assert.equal(BookingController.canCancel(lapsed), false);
    assert.equal(BookingController.payBy(lapsed), new Date(createdAt.getTime() + 24 * 3600 * 1000).toISOString());
    await assert.rejects(BookingController.markPaid(stale.id, operator.id), /holdExpired/);
    assert.equal((await BookingController.markPaid(fresh.id, operator.id)).status, 'PAID');
    // and it is no sale: 3 paid on the first departure + the fresh one; the cancelled seat isn't one either
    assert.equal((await OperatorController.getStats(operator.id)).tripsSold, 4);
    // nor is a QPay / card payment the operator's to mark
    const card = await BookingModel.findOne({ where: { departureId: departure.id, status: 'PAID' } });
    await assert.rejects(BookingController.markPaid(card!.id, operator.id), /paidOnline/);

    // each method its own hold: 31 minutes frees a QPay seat and keeps a transfer's
    const hold = async (method: PAY_METHOD, minutes: number, seats = 1) => {
      const dep = await DepartureModel.create({
        planId: plan.id,
        startDate: addDays(todayUb(), 62),
        seats
      });
      const held = await BookingModel.create({
        code: `ITR-${method}${String(stamp).slice(-4)}${minutes}`,
        userId: travellers[3].id,
        planId: plan.id,
        departureId: dep.id,
        pax: 1,
        room: ROOM.TWIN,
        totalUsd: 1000,
        method,
        status: 'PENDING_PAYMENT',
        acceptedTradeoffs: true,
        createdAt: new Date(Date.now() - minutes * 60 * 1000)
      });
      return { dep, held: await BookingController.findIdCheck(held.id) };
    };
    const qpayOld = await hold(PAY_METHOD.QPAY, 31);
    const bankOld = await hold(PAY_METHOD.BANK, 31);
    assert.equal(BookingController.stage(qpayOld.held), 'EXPIRED');
    assert.equal(
      BookingController.payBy(qpayOld.held),
      new Date(qpayOld.held.createdAt.getTime() + 30 * 60 * 1000).toISOString()
    );
    assert.equal(BookingController.stage(bankOld.held), 'PENDING_PAYMENT');
    const taker = await book(travellers[4].id, 1, { departureId: qpayOld.dep.id });
    assert.equal(taker.status, 'PAID');
    await assert.rejects(book(travellers[4].id, 1, { departureId: bankOld.dep.id }), /notEnoughSeats/);

    // settle is idempotent: the poll, the callback and the webhook may all report one payment
    const qpayNew = await hold(PAY_METHOD.QPAY, 5);
    assert.equal(BookingController.stage(qpayNew.held), 'PENDING_PAYMENT');
    assert.equal((await BookingController.settle(qpayNew.held.id, { paymentRef: 'p-1' }))!.status, 'PAID');
    const again = await BookingController.settle(qpayNew.held.id, { paymentRef: 'p-2' });
    assert.equal(again!.status, 'PAID');
    assert.equal(again!.paymentRef, 'p-1');
    assert.equal(await BookingController.settle(randomUUID()), null);
    // money after the hold: taken while the seat is free, refused (kept for a refund) once it was resold
    const lateFree = await hold(PAY_METHOD.CARD, 40);
    assert.equal((await BookingController.settle(lateFree.held.id))!.status, 'PAID');
    const lateSold = (await BookingController.settle(qpayOld.held.id, { paymentRef: 'late' }))!;
    assert.equal(lateSold.status, 'PENDING_PAYMENT');
    assert.equal(lateSold.paymentRef, 'late');
    assert.equal(BookingController.stage(await BookingController.findIdCheck(qpayOld.held.id)), 'EXPIRED');

    // paying again for the same departure (back from Stripe) releases the traveller's last online hold
    const roomy = await DepartureModel.create({ planId: plan.id, startDate: addDays(todayUb(), 63), seats: 1 });
    const first = await BookingController.createBooking(
      { planId: plan.id, departureId: roomy.id, pax: 1, room: ROOM.TWIN, method: PAY_METHOD.QPAY, notes: '', accept: true },
      travellers[5].id
    );
    assert.equal(first.status, 'PENDING_PAYMENT');
    const retry = await book(travellers[5].id, 1, { departureId: roomy.id });
    assert.equal(retry.status, 'PAID');
    assert.equal((await BookingModel.findByPk(first.id))!.status, 'CANCELLED');
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
