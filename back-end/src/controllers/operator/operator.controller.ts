import { fn, col, Op } from 'sequelize';
import config from '../../config';
import sequelize from '../../config/database';

import { BookingModel } from '../../models/booking/booking.model';
import { ClaimRatingModel } from '../../models/booking/claim-rating.model';
import { ReviewModel } from '../../models/booking/review.model';
import { OperatorModel } from '../../models/operator/operator.model';
import { ClaimModel } from '../../models/plan/claim.model';
import { PlanModel } from '../../models/plan/plan.model';
import { UserModel } from '../../models/user/user.model';

import { BOOKING_STATUS } from '../../types/booking/booking.type';
import {
  TOperatorCreate,
  TOperatorStats,
  TOperatorUpdate
} from '../../types/operator/operator.type';
import { PLAN_STATUS } from '../../types/plan/plan.type';
import { ROLES } from '../../types/user/role.type';

import { DAY_MS, parseLogin, pickFields, slugify, todayUb } from '../../utils';
import PlanController from '../plan/plan.controller';
import UserController from '../user/user.controller';

const { COMMISSION_PERCENT } = config;

const OPERATOR_FIELDS: (keyof TOperatorUpdate)[] = [
  'name',
  'licenceNo',
  'city',
  'foundedYear',
  'about',
  'languages',
  'fleet',
  'coverUrl'
];

const WEEK_MS = 7 * DAY_MS;
/** Under this many hours to reply keeps the "replies fast" badge. */
const REPLY_BADGE_HOURS = 4;

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

export default class OperatorController {
  static async findIdCheck(id: string): Promise<OperatorModel> {
    const operator = await OperatorModel.findByPk(id);
    if (!operator) throw new Error('error.operatorNotFound');
    return operator;
  }

  /** The public profile. An unverified agency has no public page yet. */
  static async getOperator(slug: string) {
    const operator = await OperatorModel.findOne({ where: { slug } });
    if (!operator?.isVerified) throw new Error('error.operatorNotFound');
    return operator;
  }

  static async getOperators(doc: { all?: boolean } = {}) {
    return OperatorModel.findAll({
      where: doc.all ? {} : { isVerified: true },
      order: [['name', 'ASC']]
    });
  }

  /** Company-level numbers: score over every promise of every plan, stars, sales, cancel rate. */
  static async getStats(operatorId: string): Promise<TOperatorStats> {
    // a fresh include per query: Sequelize writes into the options it is given
    const plan = () => ({ model: PlanModel, as: 'plan', attributes: [], where: { operatorId } });
    const [claims, reviews, bookings, plansLive] = await Promise.all([
      ClaimModel.findAll({
        attributes: ['id', 'area'],
        include: [plan(), { model: ClaimRatingModel, as: 'ratings', attributes: ['score'] }]
      }),
      ReviewModel.findAll({ attributes: ['stars'], include: [plan()] }),
      BookingModel.findAll({
        attributes: ['status', 'cancelledBy'],
        include: [plan()]
      }),
      PlanModel.count({ where: { operatorId, status: PLAN_STATUS.PUBLISHED } })
    ]);
    const byOperator = bookings.filter((b) => b.cancelledBy === ROLES.OPERATOR).length;
    return {
      score: PlanController.planScore(claims),
      areas: PlanController.areaScores(claims),
      stars: reviews.length ? sum(reviews.map((r) => r.stars)) / reviews.length : null,
      reviewCount: reviews.length,
      plansLive,
      tripsSold: bookings.filter((b) => b.status !== BOOKING_STATUS.CANCELLED).length,
      cancelRate: bookings.length ? (byOperator / bookings.length) * 100 : 0
    };
  }

  /** The profile fields that were sent, cleaned: languages trimmed, the founding year kept sane. */
  static _profile(doc: TOperatorUpdate) {
    const params = pickFields(OPERATOR_FIELDS, doc);
    if (params.name !== undefined && !String(params.name).trim())
      throw new Error('error.nameRequired');
    if (params.languages !== undefined)
      params.languages = (params.languages as string[])
        .map((language) => String(language).trim())
        .filter(Boolean)
        .slice(0, 12);
    if (params.foundedYear != null)
      params.foundedYear = Math.min(2100, Math.max(1950, Number(params.foundedYear) || 0)) || null;
    return params;
  }

  /** An agency edits its own profile; verification and reply time are not its to set. */
  static async updateProfile(operatorId: string, doc: TOperatorUpdate) {
    const operator = await this.findIdCheck(operatorId);
    return operator.update(this._profile(doc));
  }

  /**
   * Staff add an agency by hand, for one that doesn't sign up itself: the company and its first
   * OPERATOR login, which staff hand over. Verified at once when they have already seen the licence.
   */
  static async createOperator(doc: TOperatorCreate) {
    const company = doc.name?.trim();
    if (!company) throw new Error('error.companyRequired');
    const params = this._profile(doc);
    const contact = doc.contactName?.trim();
    if (!contact) throw new Error('error.nameRequired');
    UserController._checkPassword(doc.password ?? '');
    const login = parseLogin(doc.login ?? '');
    if (!login) throw new Error('error.loginInvalid');
    await UserController._checkFree(login);

    return sequelize.transaction(async (transaction) => {
      const operator = await OperatorModel.create(
        {
          ...params,
          name: company,
          slug: slugify(company, Date.now().toString(36).slice(-4)),
          // as self sign-up does when none are given
          languages: params.languages?.length ? params.languages : ['Mongolian'],
          isVerified: Boolean(doc.isVerified)
        },
        { transaction }
      );
      await UserModel.create(
        {
          ...login,
          name: contact,
          password: doc.password,
          role: ROLES.OPERATOR,
          operatorId: operator.id,
          isActive: true
        },
        { transaction }
      );
      return operator;
    });
  }

  /** Unverifying takes the agency's live plans back to the review queue. */
  static async setVerified(id: string, isVerified: boolean) {
    const operator = await this.findIdCheck(id);
    if (operator.isVerified && !isVerified)
      await PlanModel.update(
        { status: PLAN_STATUS.PENDING, submittedAt: new Date() },
        { where: { operatorId: id, status: PLAN_STATUS.PUBLISHED } }
      );
    return operator.update({ isVerified });
  }

  /** "healthy" / "slow replies" / "review needed" / "unverified" — the admin health column. */
  static healthOf(operator: OperatorModel, stats: TOperatorStats) {
    if (!operator.isVerified) return 'UNVERIFIED';
    if ((stats.score ?? 100) < 80 || stats.cancelRate > 5) return 'REVIEW_NEEDED';
    if (operator.replyHours > REPLY_BADGE_HOURS) return 'SLOW_REPLIES';
    return 'HEALTHY';
  }

  /**
   * The partner overview for the last `days` against the `days` before them: bookings, revenue, the
   * score and where it ranks, seats per week, the promise to fix first, next departures, plan funnel.
   */
  static async getDashboard(operatorId: string, days: number) {
    const now = Date.now();
    const period = Math.min(Math.max(days, 1), 366) * DAY_MS;
    const since = new Date(Math.min(now - 2 * period, now - 12 * WEEK_MS));
    const [operator, plans, bookings, stats] = await Promise.all([
      this.findIdCheck(operatorId),
      PlanController.getOperatorPlans(operatorId),
      BookingModel.findAll({
        where: { status: { [Op.ne]: BOOKING_STATUS.CANCELLED }, createdAt: { [Op.gte]: since } },
        attributes: ['pax', 'totalUsd', 'createdAt'],
        include: [{ model: PlanModel, as: 'plan', attributes: [], where: { operatorId } }]
      }),
      this.getStats(operatorId)
    ]);
    const inPeriod = bookings.filter((b) => b.createdAt.getTime() >= now - period);
    const previous = bookings.filter(
      (b) => b.createdAt.getTime() < now - period && b.createdAt.getTime() >= now - 2 * period
    );
    const revenue = sum(inPeriod.map((b) => b.totalUsd));
    const previousRevenue = sum(previous.map((b) => b.totalUsd));

    const upcoming = plans.flatMap((plan) =>
      PlanController.getUpcoming(plan).map((departure) => ({ ...departure, plan }))
    );
    const seatsTotal = sum(upcoming.map((d) => d.seats));
    const seatsSold = sum(upcoming.map((d) => d.seats - d.left));

    // the score a month ago, from the ratings that existed then
    const monthAgo = await ClaimRatingModel.findAll({
      attributes: ['score'],
      include: [
        { model: ReviewModel, as: 'review', attributes: [], where: { createdAt: { [Op.lt]: new Date(now - 30 * DAY_MS) } } },
        { model: ClaimModel, as: 'claim', attributes: [], include: [{ model: PlanModel, as: 'plan', attributes: [], where: { operatorId } }] }
      ]
    });
    const oldScore = PlanController.scoreOf(monthAgo.map((r) => r.score));

    // where it ranks among verified agencies (1 = best)
    const scores = await Promise.all(
      (await this.getOperators()).map(async (other) => (await this.getStats(other.id)).score ?? 0)
    );
    const better = scores.filter((score) => score > (stats.score ?? 0)).length;
    const topPercent = Math.max(1, Math.round(((better + 1) / Math.max(scores.length, 1)) * 100));

    const weeks = Array.from({ length: 12 }, (_, index) => {
      const start = now - (12 - index) * WEEK_MS;
      return {
        start: new Date(start),
        seats: sum(
          bookings
            .filter((b) => b.createdAt.getTime() >= start && b.createdAt.getTime() < start + WEEK_MS)
            .map((b) => b.pax)
        )
      };
    });

    // the most broken promise across live plans: lowest claim score, then the most ratings behind it
    const gap = plans
      .filter((plan) => plan.status === PLAN_STATUS.PUBLISHED)
      .map((plan) => ({ plan, gap: PlanController.worstGap(plan.claims ?? []) }))
      .filter((entry) => entry.gap)
      .sort((a, b) => a.gap!.score - b.gap!.score || b.gap!.total - a.gap!.total)[0];

    const next = upcoming.sort((a, b) => a.startDate.localeCompare(b.startDate)).slice(0, 5);
    const nextBookings = await BookingModel.findAll({
      where: { departureId: next.map((d) => d.id), status: { [Op.ne]: BOOKING_STATUS.CANCELLED } },
      attributes: ['departureId', 'guide', 'status']
    });

    return {
      operator,
      bookings: inPeriod.length,
      bookingsDelta: inPeriod.length - previous.length,
      seatsSold,
      fillRate: seatsTotal ? Math.round((seatsSold / seatsTotal) * 100) : 0,
      revenueUsd: revenue,
      revenueDelta: previousRevenue
        ? Math.round(((revenue - previousRevenue) / previousRevenue) * 100)
        : null,
      payoutPercent: 100 - COMMISSION_PERCENT,
      score: stats.score,
      scoreDelta: stats.score != null && oldScore != null ? stats.score - oldScore : 0,
      topPercent,
      replyHours: operator.replyHours,
      fastReplies: operator.replyHours <= REPLY_BADGE_HOURS,
      weeks,
      gap: gap
        ? {
            ...gap.gap!,
            planId: gap.plan.id,
            planTitle: gap.plan.titleEn,
            claimText: (gap.plan.claims ?? []).find((c) => c.id === gap.gap!.claimId)?.text ?? ''
          }
        : null,
      nextDepartures: next.map((departure) => {
        const live = nextBookings.filter((b) => b.departureId === departure.id);
        const sold = departure.seats - departure.left;
        const state =
          departure.left === 0
            ? 'FULL'
            : sold < departure.plan.minGroup
              ? 'NEEDS_MORE'
              : live.length && live.every((b) => b.guide && b.status === BOOKING_STATUS.CONFIRMED)
                ? 'GUIDE_ASSIGNED'
                : 'NO_GUIDE';
        return {
          id: departure.id,
          startDate: departure.startDate,
          planTitle: departure.plan.titleEn,
          seats: departure.seats,
          sold,
          missing: Math.max(departure.plan.minGroup - sold, 0),
          state
        };
      }),
      planPerformance: plans
        .filter((plan) => plan.status === PLAN_STATUS.PUBLISHED)
        .map((plan) => {
          const sold = sum((plan.departures ?? []).map((d) => (d.bookings ?? []).length));
          return {
            id: plan.id,
            title: plan.titleEn,
            views: plan.views,
            conversion: plan.views ? Math.round((sold / plan.views) * 1000) / 10 : 0,
            score: PlanController.getScore(plan)
          };
        })
    };
  }

  /** The admin header: agencies, the queue, this year's sales and the last month's bookings. */
  static async getMarketplaceStats() {
    const yearStart = new Date(`${todayUb().slice(0, 4)}-01-01T00:00:00+08:00`);
    const [verified, pending, gmv, bookings] = await Promise.all([
      OperatorModel.count({ where: { isVerified: true } }),
      PlanModel.count({ where: { status: PLAN_STATUS.PENDING } }),
      BookingModel.findOne({
        attributes: [[fn('COALESCE', fn('SUM', col('totalUsd')), 0), 'total']],
        where: { status: { [Op.ne]: BOOKING_STATUS.CANCELLED }, createdAt: { [Op.gte]: yearStart } },
        raw: true
      }) as Promise<{ total: string } | null>,
      BookingModel.count({ where: { createdAt: { [Op.gte]: new Date(Date.now() - 30 * DAY_MS) } } })
    ]);
    return {
      verifiedOperators: verified,
      pendingPlans: pending,
      gmvUsd: Number(gmv?.total ?? 0),
      bookings30d: bookings
    };
  }
}
