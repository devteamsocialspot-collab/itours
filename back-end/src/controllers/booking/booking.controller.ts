import { randomBytes } from 'node:crypto';
import { Op } from 'sequelize';
import config from '../../config';

import sequelize from '../../config/database';
import { BookingModel } from '../../models/booking/booking.model';
import { ReviewModel } from '../../models/booking/review.model';
import { OperatorModel } from '../../models/operator/operator.model';
import { DepartureModel } from '../../models/plan/departure.model';
import { PlanModel } from '../../models/plan/plan.model';
import { UserModel } from '../../models/user/user.model';

import {
  BOOKING_STAGE,
  BOOKING_STATUS,
  ORDER_TAB,
  PAY_METHOD,
  ROOM,
  TBookingCreate
} from '../../types/booking/booking.type';
import { TContextUser, TPagination } from '../../types/common.type';
import { PLAN_STATUS } from '../../types/plan/plan.type';
import { ROLES, STAFF_ROLES } from '../../types/user/role.type';

import { addDays, pagination, todayUb } from '../../utils';

const { COMMISSION_PERCENT } = config;

/** Which stages each orders-inbox tab holds. */
const TAB_STAGES: Record<ORDER_TAB, BOOKING_STAGE[]> = {
  [ORDER_TAB.ACTION]: [BOOKING_STAGE.PAID, BOOKING_STAGE.PENDING_PAYMENT],
  [ORDER_TAB.CONFIRMED]: [BOOKING_STAGE.CONFIRMED],
  [ORDER_TAB.TRAVELLING]: [BOOKING_STAGE.TRAVELLING],
  [ORDER_TAB.COMPLETED]: [BOOKING_STAGE.COMPLETED],
  [ORDER_TAB.CANCELLED]: [BOOKING_STAGE.CANCELLED]
};

type WithTrip = BookingModel & { departure: DepartureModel; plan: PlanModel };

export default class BookingController {
  /** Everything the trips list, the confirmation and the inbox show about a booking. */
  static include = () => [
    { model: PlanModel, as: 'plan', include: [{ model: OperatorModel, as: 'operator' }] },
    { model: DepartureModel, as: 'departure' },
    { model: UserModel, as: 'traveller' },
    { model: ReviewModel, as: 'review', attributes: ['id'] }
  ];

  static async findIdCheck(id: string): Promise<WithTrip> {
    const booking = await BookingModel.findByPk(id, { include: this.include() });
    if (!booking) throw new Error('error.bookingNotFound');
    return booking as WithTrip;
  }

  // —— derived fields ——

  /** The trip's last day (YYYY-MM-DD). */
  static lastDay(booking: WithTrip) {
    return addDays(booking.departure.startDate, booking.plan.days - 1);
  }

  /** The stored state, plus where a confirmed trip is in time. */
  static stage(booking: WithTrip): BOOKING_STAGE {
    if (booking.status !== BOOKING_STATUS.CONFIRMED)
      return booking.status as unknown as BOOKING_STAGE;
    const today = todayUb();
    if (this.lastDay(booking) < today) return BOOKING_STAGE.COMPLETED;
    if (booking.departure.startDate <= today) return BOOKING_STAGE.TRAVELLING;
    return BOOKING_STAGE.CONFIRMED;
  }

  /** Escrow: the agency receives the total less the commission, the day after the trip ends. */
  static payout(booking: WithTrip) {
    return {
      usd: Math.round(booking.totalUsd * (100 - COMMISSION_PERCENT)) / 100,
      date: addDays(this.lastDay(booking), 1)
    };
  }

  /** Free cancellation ends this many days before departure; after it, half is refunded. */
  static freeCancelUntil(booking: WithTrip) {
    return addDays(booking.departure.startDate, -booking.plan.freeCancelDays);
  }

  static canCancel(booking: WithTrip) {
    return (
      booking.status !== BOOKING_STATUS.CANCELLED &&
      booking.departure.startDate > todayUb()
    );
  }

  static canReview(booking: WithTrip) {
    return this.stage(booking) === BOOKING_STAGE.COMPLETED && !booking.review;
  }

  /** Per-person price for this many travellers: the group price once the group is big enough. */
  static unitPrice(plan: PlanModel, pax: number) {
    return plan.groupPriceUsd && plan.groupPriceFrom && pax >= plan.groupPriceFrom
      ? plan.groupPriceUsd
      : plan.priceUsd;
  }

  // —— traveller ——

  /**
   * Seats on a departure. The price is recomputed here, never taken from the form. The departure row
   * is locked (SELECT … FOR UPDATE) for the seat check and the insert, so buyers racing for one
   * departure queue up instead of overselling it: whoever is last to the last seat is told there are
   * not enough seats (BR-03), and nobody is refused while seats remain.
   */
  static async createBooking(doc: TBookingCreate, userId: string) {
    const plan = await PlanModel.findOne({
      where: { id: doc.planId, status: PLAN_STATUS.PUBLISHED }
    });
    if (!plan) throw new Error('error.planNotFound');
    if (!doc.accept) throw new Error('error.mustAcceptTradeoffs');
    const pax = Math.min(Math.max(Math.round(Number(doc.pax) || 0), 1), plan.maxGroup);
    const room = doc.room === ROOM.SINGLE ? ROOM.SINGLE : ROOM.TWIN;
    const method = Object.values(PAY_METHOD).includes(doc.method) ? doc.method : PAY_METHOD.CARD;
    const totalUsd =
      this.unitPrice(plan, pax) * pax +
      (room === ROOM.SINGLE ? (plan.singleSupplement ?? 0) * pax : 0);

    const booking = await sequelize.transaction(async (transaction) => {
      const departure = await DepartureModel.findOne({
        where: { id: doc.departureId, planId: plan.id },
        lock: transaction.LOCK.UPDATE,
        transaction
      });
      if (!departure) throw new Error('error.departureNotFound');
      if (departure.startDate < todayUb()) throw new Error('error.departurePast');
      const taken =
        (await BookingModel.sum('pax', {
          where: { departureId: departure.id, status: { [Op.ne]: BOOKING_STATUS.CANCELLED } },
          transaction
        })) || 0;
      if (departure.seats - taken < pax) throw new Error('error.notEnoughSeats');
      return BookingModel.create(
        {
          code: `ITR-${randomBytes(3).toString('hex').toUpperCase()}`,
          userId,
          planId: plan.id,
          departureId: departure.id,
          pax,
          room,
          totalUsd,
          method,
          // card and QPay settle at once; a transfer waits for the agency to see the money
          status: method === PAY_METHOD.BANK ? BOOKING_STATUS.PENDING_PAYMENT : BOOKING_STATUS.PAID,
          notes: String(doc.notes ?? '').trim().slice(0, 1000),
          acceptedTradeoffs: true
        },
        { transaction }
      );
    });
    return this.findIdCheck(booking.id);
  }

  static async getMyBookings(userId: string) {
    const bookings = await BookingModel.findAll({
      where: { userId },
      include: this.include()
    });
    return (bookings as WithTrip[]).sort((a, b) =>
      b.departure.startDate.localeCompare(a.departure.startDate)
    );
  }

  /** The confirmation page: its traveller, the agency that sells the plan, or staff. */
  static async getBooking(code: string, viewer: TContextUser) {
    const booking = await BookingModel.findOne({ where: { code }, include: this.include() });
    if (!booking) throw new Error('error.bookingNotFound');
    const operatorId =
      viewer.userRole === ROLES.OPERATOR
        ? (await UserModel.findByPk(viewer.userId))?.operatorId
        : null;
    const allowed =
      booking.userId === viewer.userId ||
      operatorId === booking.plan?.operatorId ||
      STAFF_ROLES.includes(viewer.userRole);
    if (!allowed) throw new Error('error.bookingNotFound');
    return booking as WithTrip;
  }

  static async cancelBooking(id: string, userId: string) {
    const booking = await this.findIdCheck(id);
    if (booking.userId !== userId) throw new Error('error.bookingNotFound');
    if (!this.canCancel(booking)) throw new Error('error.cannotCancel');
    await booking.update({ status: BOOKING_STATUS.CANCELLED, cancelledBy: ROLES.USER });
    return booking;
  }

  // —— agency ——

  /** Someone else's order is reported as missing, not as forbidden. */
  static async findOwnCheck(id: string, operatorId: string) {
    const booking = await this.findIdCheck(id);
    if (booking.plan.operatorId !== operatorId) throw new Error('error.bookingNotFound');
    return booking;
  }

  /** Every booking on the agency's plans, newest first, with what the inbox shows. */
  static async _operatorBookings(operatorId: string) {
    return (await BookingModel.findAll({
      include: [
        {
          model: PlanModel,
          as: 'plan',
          where: { operatorId },
          include: [{ model: OperatorModel, as: 'operator' }]
        },
        { model: DepartureModel, as: 'departure' },
        { model: UserModel, as: 'traveller' },
        { model: ReviewModel, as: 'review', attributes: ['id'] }
      ],
      order: [['createdAt', 'DESC']]
    })) as WithTrip[];
  }

  /**
   * The orders inbox: one tab, a search over name / code / plan, and the count per tab. Newest
   * booking first, or by `orderBy: 'startDate'` (the departure day); `direction` ASC flips either.
   * ponytail: staged in memory (travelling vs completed needs each plan's length) — fine for an
   * agency's few thousand orders; push the date maths into SQL beyond that.
   */
  static async getOrders(
    operatorId: string,
    doc: { tab?: ORDER_TAB; search?: string; orderBy?: string; direction?: string } & TPagination
  ) {
    const bookings = await this._operatorBookings(operatorId);
    const tabs = Object.fromEntries(
      Object.values(ORDER_TAB).map((tab) => [
        tab,
        bookings.filter((b) => TAB_STAGES[tab].includes(this.stage(b))).length
      ])
    ) as Record<ORDER_TAB, number>;
    const tab = doc.tab && TAB_STAGES[doc.tab] ? doc.tab : ORDER_TAB.ACTION;
    const needle = doc.search?.trim().toLowerCase();
    const rows = bookings.filter(
      (b) =>
        TAB_STAGES[tab].includes(this.stage(b)) &&
        (!needle ||
          [b.code, b.traveller?.name ?? '', b.plan.titleEn].some((value) =>
            value.toLowerCase().includes(needle)
          ))
    );
    // ISO strings and YYYY-MM-DD days both sort as text; ties keep the newest booking first
    const key = (b: WithTrip) =>
      doc.orderBy === 'startDate' ? b.departure.startDate : b.createdAt.toISOString();
    const sign = doc.direction?.toUpperCase() === 'ASC' ? 1 : -1;
    rows.sort((a, b) => sign * key(a).localeCompare(key(b)));
    const { limit, offset } = pagination(doc);
    return { rows: rows.slice(offset, offset + limit), count: rows.length, tabs };
  }

  /** Assigns the guide and driver; a paid order becomes confirmed. A confirmed one can be reassigned. */
  static async confirmOrder(
    doc: { id: string; guide: string; driver?: string },
    operatorId: string
  ) {
    const booking = await this.findOwnCheck(doc.id, operatorId);
    if (![BOOKING_STATUS.PAID, BOOKING_STATUS.CONFIRMED].includes(booking.status))
      throw new Error('error.orderNotPaid');
    const guide = String(doc.guide ?? '').trim().slice(0, 80);
    if (!guide) throw new Error('error.guideRequired');
    await booking.update({
      status: BOOKING_STATUS.CONFIRMED,
      guide,
      driver: String(doc.driver ?? '').trim().slice(0, 80)
    });
    return booking;
  }

  /** The bank transfer arrived. */
  static async markPaid(id: string, operatorId: string) {
    const booking = await this.findOwnCheck(id, operatorId);
    if (booking.status !== BOOKING_STATUS.PENDING_PAYMENT) throw new Error('error.orderNotPending');
    await booking.update({ status: BOOKING_STATUS.PAID });
    return booking;
  }

  /** The agency cancels: the traveller is refunded in full, and it counts against the agency. */
  static async cancelOrder(id: string, operatorId: string) {
    const booking = await this.findOwnCheck(id, operatorId);
    if (!this.canCancel(booking)) throw new Error('error.cannotCancel');
    await booking.update({ status: BOOKING_STATUS.CANCELLED, cancelledBy: ROLES.OPERATOR });
    return booking;
  }

  /** Every order of the agency as CSV, for its accountant. A BOM so Excel reads Cyrillic names. */
  static async exportCsv(operatorId: string) {
    const all = await this._operatorBookings(operatorId);
    const cell = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const lines = [
      ['code', 'created', 'traveller', 'email', 'phone', 'country', 'plan', 'departure', 'pax', 'room', 'total_usd', 'payout_usd', 'method', 'stage', 'guide', 'driver', 'notes'],
      ...all.map((b) => [
        b.code,
        b.createdAt.toISOString(),
        b.traveller?.name,
        b.traveller?.email,
        b.traveller?.phone,
        b.traveller?.country,
        b.plan.titleEn,
        b.departure.startDate,
        b.pax,
        b.room,
        b.totalUsd,
        this.payout(b).usd,
        b.method,
        this.stage(b),
        b.guide,
        b.driver,
        b.notes
      ])
    ];
    return '﻿' + lines.map((line) => line.map(cell).join(',')).join('\r\n');
  }
}
