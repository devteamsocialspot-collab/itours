import { Op } from 'sequelize';

import sequelize from '../../config/database';
import { BookingModel } from '../../models/booking/booking.model';
import { ClaimRatingModel } from '../../models/booking/claim-rating.model';
import { ReviewModel } from '../../models/booking/review.model';
import { OperatorModel } from '../../models/operator/operator.model';
import { ClaimModel } from '../../models/plan/claim.model';
import { DepartureModel } from '../../models/plan/departure.model';
import { PlanDayModel } from '../../models/plan/plan-day.model';
import { PlanModel } from '../../models/plan/plan.model';
import { SavedPlanModel } from '../../models/plan/saved-plan.model';
import { UserModel } from '../../models/user/user.model';

import { BOOKING_STATUS } from '../../types/booking/booking.type';
import { TTokenValue } from '../../types/common.type';
import {
  AREA,
  CLAIM_AREA,
  CLAIM_KIND,
  DIFFICULTY,
  PLAN_STATUS,
  TPlanCheck,
  TPlanInput,
  TSearchPlans
} from '../../types/plan/plan.type';
import { ROLES, STAFF_ROLES } from '../../types/user/role.type';

import { cleanUrls, pagination, pickFields, slugify, todayUb } from '../../utils';

const PLAN_FIELDS: (keyof TPlanInput)[] = [
  'titleEn',
  'titleMn',
  'region',
  'area',
  'season',
  'minGroup',
  'maxGroup',
  'difficulty',
  'vehicle',
  'sleeping',
  'lodging',
  'summary',
  'summaryMn',
  'priceUsd',
  'groupPriceUsd',
  'groupPriceFrom',
  'singleSupplement',
  'included',
  'excluded',
  'photos',
  'freeCancelDays',
  'totalKm',
  'unpavedPct'
];

/** A rating of 2/1/0 per promise; a set of them scores mean / 2 × 100. */
type Rated = { id: string; area: CLAIM_AREA; ratings?: { score: number }[] };

/** Live bookings only: a cancelled one gives its seats back. */
const LIVE = { status: { [Op.ne]: BOOKING_STATUS.CANCELLED } };

/** "Best match" pulls a thinly-reviewed plan towards this score, as if it had this many reviews. */
const PRIOR_SCORE = 80;
const PRIOR_REVIEWS = 5;
/** One rank point per this many dollars, so equal scores sort cheapest first. */
const PRICE_PER_POINT = 500;

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
const text = (value: unknown, max: number) =>
  String(value ?? '').trim().slice(0, max);
const int = (value: unknown, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.round(Number(value) || 0)));
const intOrNull = (value: unknown, min: number, max: number) =>
  value === null || value === undefined || value === '' || isNaN(Number(value))
    ? null
    : int(value, min, max);
const oneOf = <T extends string>(value: unknown, list: T[], fallback: T) =>
  list.includes(value as T) ? (value as T) : fallback;
const lines = (value: unknown, max = 20) =>
  (Array.isArray(value) ? value : [])
    .map((line) => text(line, 300))
    .filter(Boolean)
    .slice(0, max);

export default class PlanController {
  /**
   * What every plan read loads, so the derived fields never need a query of their own. A fresh array
   * per query: Sequelize writes into the include options it is given. Each list is `separate` (its
   * own query): joined, claims × ratings × days × departures × reviews multiply into millions of rows.
   */
  static include = () => [
    { model: OperatorModel, as: 'operator' },
    {
      model: ClaimModel,
      as: 'claims',
      separate: true,
      include: [
        { model: ClaimRatingModel, as: 'ratings', attributes: ['score'] }
      ]
    },
    { model: PlanDayModel, as: 'dayItems', separate: true },
    {
      model: DepartureModel,
      as: 'departures',
      separate: true,
      include: [
        {
          model: BookingModel,
          as: 'bookings',
          attributes: ['pax'],
          where: LIVE,
          required: false
        }
      ]
    },
    { model: ReviewModel, as: 'reviews', attributes: ['planId', 'stars'], separate: true }
  ];

  // —— the Expectation Score ——

  /** 2 = as described, 1 = partly, 0 = not: mean / 2 × 100, so 100 means every promise held. */
  static scoreOf(scores: number[]): number | null {
    if (!scores.length) return null;
    return Math.round((sum(scores) / scores.length) * 50);
  }

  static planScore(claims: Rated[]) {
    return this.scoreOf(
      claims.flatMap((claim) => (claim.ratings ?? []).map((r) => r.score))
    );
  }

  static claimScore(claim: Rated) {
    return this.scoreOf((claim.ratings ?? []).map((r) => r.score));
  }

  static areaScores(claims: Rated[]) {
    return Object.values(CLAIM_AREA).map((area) => ({
      area,
      score: this.planScore(claims.filter((claim) => claim.area === area))
    }));
  }

  /**
   * The promise dragging the plan down the most, when one is clearly off (under 85 with 3+ ratings),
   * and what the plan would score with it reworded — rewording resets that promise's ratings.
   */
  static worstGap(claims: Rated[]) {
    const candidates = claims
      .filter((claim) => (claim.ratings ?? []).length >= 3)
      .map((claim) => ({ claim, score: this.claimScore(claim)! }))
      .filter(({ score }) => score < 85)
      .sort((a, b) => a.score - b.score);
    if (!candidates.length) return null;
    const { claim, score } = candidates[0];
    const ratings = claim.ratings ?? [];
    return {
      claimId: claim.id,
      score,
      misses: ratings.filter((r) => r.score < 2).length,
      total: ratings.length,
      current: this.planScore(claims)!,
      ifFixed:
        this.planScore(claims.filter((other) => other.id !== claim.id)) ?? 100
    };
  }

  /** "Best match": the score as a Bayesian average, less a point per $500. No paid placement. */
  static rankValue(score: number | null, reviewCount: number, priceUsd: number) {
    const bayes =
      ((score ?? PRIOR_SCORE) * reviewCount + PRIOR_SCORE * PRIOR_REVIEWS) /
      (reviewCount + PRIOR_REVIEWS);
    return bayes - priceUsd / PRICE_PER_POINT;
  }

  // —— derived fields (type resolvers), all from what INCLUDE loaded ——

  /** Loads what INCLUDE would have, onto a plan that came without it (a booking's plan, say). */
  static async _full(plan: PlanModel): Promise<PlanModel> {
    if (plan.claims && plan.dayItems && plan.departures && plan.reviews)
      return plan;
    const full = await PlanModel.findByPk(plan.id, { include: this.include() });
    if (!full) throw new Error('error.planNotFound');
    Object.assign(plan, {
      operator: full.operator,
      claims: full.claims,
      dayItems: full.dayItems,
      departures: full.departures,
      reviews: full.reviews
    });
    return plan;
  }

  static getDays(plan: PlanModel) {
    return [...(plan.dayItems ?? [])].sort((a, b) => a.dayNo - b.dayNo);
  }

  static getClaims(plan: PlanModel) {
    return [...(plan.claims ?? [])].sort((a, b) => a.sort - b.sort);
  }

  /** Departures still ahead, earliest first, with the seats nobody has taken yet. */
  static getUpcoming(plan: PlanModel) {
    const today = todayUb();
    return (plan.departures ?? [])
      .filter((departure) => departure.startDate >= today)
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .map((departure) => ({
        id: departure.id,
        startDate: departure.startDate,
        seats: departure.seats,
        left: departure.seats - sum((departure.bookings ?? []).map((b) => b.pax))
      }));
  }

  static getScore(plan: PlanModel) {
    return this.planScore(plan.claims ?? []);
  }

  static getStars(plan: PlanModel) {
    const reviews = plan.reviews ?? [];
    return reviews.length
      ? sum(reviews.map((review) => review.stars)) / reviews.length
      : null;
  }

  /** Comfort facts the search filters and the compare table use. The last day ends the trip: no night. */
  static getComfort(plan: PlanModel) {
    const days = this.getDays(plan);
    const drives = days.map((day) => day.driveHours ?? 0);
    const nights = days.slice(0, -1);
    return {
      maxDrive: Math.max(0, ...drives),
      driveTotal: sum(drives),
      showerNights: nights.filter((day) => day.hotShower).length,
      flushNights: nights.filter((day) => day.flushToilet).length,
      nightCount: nights.length
    };
  }

  static getRank(plan: PlanModel) {
    return this.rankValue(
      this.getScore(plan),
      plan.reviews?.length ?? 0,
      plan.priceUsd
    );
  }

  /**
   * What a plan needs before it can be submitted — the editor checklist, the submit check and the
   * admin queue's auto-check tags all read this one list. Labels are i18n keys.
   */
  static getChecks(plan: PlanModel): TPlanCheck[] {
    const claims = this.getClaims(plan);
    const days = this.getDays(plan);
    const pros = claims.filter((c) => c.kind === CLAIM_KIND.PRO).length;
    const cons = claims.filter((c) => c.kind === CLAIM_KIND.CON).length;
    const missing = days
      .filter((day) => day.driveHours == null)
      .map((day) => day.dayNo);
    const range =
      missing.length > 1
        ? `d${missing[0]}–d${missing[missing.length - 1]}`
        : `d${missing[0]}`;
    const photos = plan.photos.length;
    // "2/3 pros" until there are enough, then just "4 pros"
    const of3 = (n: number) => (n >= 3 ? n : `${n}/3`);
    return [
      {
        key: 'check.basics',
        ok: Boolean(plan.titleEn.trim() && plan.region.trim() && plan.season.trim()),
        required: true
      },
      {
        key: 'check.days',
        vars: { n: days.length },
        ok: days.length > 0 && days.every((day) => day.title.trim()),
        required: true
      },
      missing.length
        ? { key: 'check.driveMissing', vars: { range }, ok: false, required: true }
        : { key: 'check.driveAll', ok: true, required: true },
      { key: 'check.pros', vars: { n: of3(pros) }, ok: pros >= 3, required: true },
      cons
        ? { key: 'check.cons', vars: { n: of3(cons) }, ok: cons >= 3, required: true }
        : { key: 'check.noCons', ok: false, required: true },
      { key: 'check.price', ok: plan.priceUsd > 0, required: true },
      {
        key: 'check.departure',
        ok: this.getUpcoming(plan).length > 0,
        required: true
      },
      photos
        ? { key: 'check.photos', vars: { n: photos }, ok: true, required: true }
        : { key: 'check.noPhotos', ok: false, required: true },
      { key: 'check.morePhotos', ok: photos >= 5, required: false },
      { key: 'check.titleMn', ok: Boolean(plan.titleMn.trim()), required: false }
    ];
  }

  static canSubmit(plan: PlanModel) {
    return this.getChecks(plan).every((check) => check.ok || !check.required);
  }

  // —— reads ——

  static async findIdCheck(id: string): Promise<PlanModel> {
    const plan = await PlanModel.findByPk(id, { include: this.include() });
    if (!plan) throw new Error('error.planNotFound');
    return plan;
  }

  /** An OPERATOR's own plan. Someone else's is reported as missing, not as forbidden. */
  static async findOwnCheck(id: string, operatorId: string) {
    const plan = await this.findIdCheck(id);
    if (plan.operatorId !== operatorId) throw new Error('error.planNotFound');
    return plan;
  }

  /**
   * The public search. Published plans of verified agencies, filtered on the comfort facts of their
   * days, ranked by "best match" (or score / price), with the agency counts for the filter rail.
   * ponytail: filtered and ranked in memory — fine for a few hundred plans; move the filters into SQL
   * when the catalogue grows past that.
   */
  static async getPlans(doc: TSearchPlans) {
    const plans = await PlanModel.findAll({
      where: { status: PLAN_STATUS.PUBLISHED },
      include: this.include().map((include) =>
        include.as === 'operator'
          ? { ...include, where: { isVerified: true } }
          : include
      )
    });
    const needle = doc.search?.trim().toLowerCase();
    const pax = Math.max(doc.pax ?? 1, 1);
    const fitsMonth = (plan: PlanModel) =>
      !doc.month ||
      this.getUpcoming(plan).some(
        (d) => d.startDate.startsWith(doc.month!) && d.left >= pax
      );
    const matching = plans.filter(
      (plan) =>
        (!doc.area || plan.area === doc.area) &&
        (!needle ||
          [plan.titleEn, plan.titleMn, plan.region, plan.area, plan.summary].some(
            (value) => value.toLowerCase().includes(needle)
          ))
    );
    const results = matching.filter((plan) => {
      const comfort = this.getComfort(plan);
      const score = this.getScore(plan) ?? 0;
      const deal = doc.dealBreakers ?? [];
      return (
        (!doc.minDays || plan.days >= doc.minDays) &&
        (!doc.maxDays || plan.days <= doc.maxDays) &&
        plan.maxGroup >= pax &&
        fitsMonth(plan) &&
        score >= (doc.minScore ?? 0) &&
        (!doc.maxPrice || plan.priceUsd <= doc.maxPrice) &&
        (!doc.difficulty?.length || doc.difficulty.includes(plan.difficulty)) &&
        (doc.lodging ?? []).every((type) => plan.lodging.includes(type)) &&
        (!deal.includes('shower') ||
          comfort.showerNights === comfort.nightCount) &&
        (!deal.includes('flush') || comfort.flushNights === comfort.nightCount) &&
        (!deal.includes('drive') || comfort.maxDrive <= 5) &&
        (!deal.includes('english') ||
          (plan.operator?.languages ?? []).some((l) => l.startsWith('English'))) &&
        (!doc.operators?.length ||
          doc.operators.includes(plan.operator?.slug ?? ''))
      );
    });
    const sorted = results.sort((a, b) =>
      doc.sort === 'price'
        ? a.priceUsd - b.priceUsd
        : doc.sort === 'score'
          ? (this.getScore(b) ?? 0) - (this.getScore(a) ?? 0)
          : this.getRank(b) - this.getRank(a)
    );
    const { limit, offset } = pagination(doc);
    // the operator facet counts the search words and region only, so ticking one agency never hides the others
    const facets = new Map<string, { slug: string; name: string; count: number }>();
    for (const plan of matching) {
      const operator = plan.operator!;
      const facet = facets.get(operator.slug) ?? {
        slug: operator.slug,
        name: operator.name,
        count: 0
      };
      facet.count++;
      facets.set(operator.slug, facet);
    }
    return {
      rows: sorted.slice(offset, offset + limit),
      count: sorted.length,
      facets: [...facets.values()]
    };
  }

  /**
   * The plan page. A draft is visible to its own agency and to staff (preview); to anyone else it
   * does not exist. A public view by anyone but the agency counts towards its conversion numbers.
   */
  static async getPlan(slug: string, viewer: Pick<TTokenValue, 'userId' | 'userRole'>) {
    const plan = await PlanModel.findOne({
      where: { slug },
      include: this.include()
    });
    if (!plan) throw new Error('error.planNotFound');
    const operatorId =
      viewer.userRole === ROLES.OPERATOR && viewer.userId
        ? (await UserModel.findByPk(viewer.userId))?.operatorId
        : null;
    const isOwner = operatorId === plan.operatorId;
    const isStaff = STAFF_ROLES.includes(viewer.userRole);
    if (plan.status !== PLAN_STATUS.PUBLISHED && !isOwner && !isStaff)
      throw new Error('error.planNotFound');
    if (plan.status === PLAN_STATUS.PUBLISHED && !isOwner && !isStaff)
      await plan.increment('views', { silent: true });
    return plan;
  }

  static async getOperatorPlans(operatorId: string, status?: PLAN_STATUS) {
    return PlanModel.findAll({
      where: { operatorId, ...(status ? { status } : {}) },
      include: this.include(),
      order: [['updatedAt', 'DESC']]
    });
  }

  /** The admin queue: submitted plans, oldest first. */
  static async getReviewQueue() {
    return PlanModel.findAll({
      where: { status: PLAN_STATUS.PENDING },
      include: this.include(),
      order: [['submittedAt', 'ASC']]
    });
  }

  static async getSavedPlans(userId: string) {
    const saved = await SavedPlanModel.findAll({
      where: { userId },
      attributes: ['planId']
    });
    return PlanModel.findAll({
      where: {
        id: saved.map((row) => row.planId),
        status: PLAN_STATUS.PUBLISHED
      },
      include: this.include()
    });
  }

  // —— writes ——

  /** Saved / unsaved — the shortlist is a toggle. Returns whether it is saved now. */
  static async toggleSave(planId: string, userId: string) {
    const existing = await SavedPlanModel.findOne({ where: { planId, userId } });
    if (existing) {
      await existing.destroy();
      return false;
    }
    await this.findIdCheck(planId);
    await SavedPlanModel.create({ planId, userId });
    return true;
  }

  /** A blank draft with one day, for the editor to fill. */
  static async createPlan(operatorId: string) {
    const plan = await PlanModel.create({
      operatorId,
      slug: slugify('new-plan', Date.now().toString(36)),
      days: 1
    });
    await PlanDayModel.create({ planId: plan.id, dayNo: 1, place: 'Ulaanbaatar' });
    return this.findIdCheck(plan.id);
  }

  /**
   * The editor sends the whole plan. Mutations are public POSTs, so every field is re-checked here:
   * allow-listed, trimmed, length-capped, numbers clamped, enums and URLs validated.
   */
  static _validateInput(doc: TPlanInput) {
    const params = pickFields(PLAN_FIELDS, doc);
    const maxGroup = int(params.maxGroup ?? 8, 1, 60);
    const clean: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(params)) {
      if (['titleEn', 'titleMn'].includes(key)) clean[key] = text(value, 140);
      else if (['summary', 'summaryMn'].includes(key)) clean[key] = text(value, 2000);
      else if (['region', 'season', 'vehicle', 'sleeping'].includes(key))
        clean[key] = text(value, 120);
      else if (key === 'area') clean.area = oneOf(value, Object.values(AREA), AREA.CENTRAL);
      else if (key === 'difficulty')
        clean.difficulty = oneOf(value, Object.values(DIFFICULTY), DIFFICULTY.EASY);
      else if (key === 'lodging') clean.lodging = lines(value, 6);
      else if (['included', 'excluded'].includes(key)) clean[key] = lines(value);
      else if (key === 'photos') clean.photos = cleanUrls(value).slice(0, 30);
      else if (key === 'priceUsd') clean.priceUsd = int(value, 0, 50000);
      else if (key === 'groupPriceUsd') clean.groupPriceUsd = intOrNull(value, 0, 50000);
      else if (key === 'groupPriceFrom') clean.groupPriceFrom = intOrNull(value, 2, 60);
      else if (key === 'singleSupplement')
        clean.singleSupplement = intOrNull(value, 0, 10000);
      else if (key === 'freeCancelDays') clean.freeCancelDays = int(value, 0, 120);
      else if (key === 'totalKm') clean.totalKm = intOrNull(value, 0, 20000);
      else if (key === 'unpavedPct') clean.unpavedPct = intOrNull(value, 0, 100);
    }
    if (params.maxGroup !== undefined) clean.maxGroup = maxGroup;
    if (params.minGroup !== undefined) clean.minGroup = int(params.minGroup, 1, maxGroup);
    return {
      fields: clean,
      dayItems: doc.dayItems?.slice(0, 40).map((day) => ({
        place: text(day.place, 80),
        title: text(day.title, 160),
        description: text(day.description, 2000),
        driveHours:
          day.driveHours == null ? null : Math.min(16, Math.max(0, Number(day.driveHours) || 0)),
        sleeping: text(day.sleeping, 80),
        meals: text(day.meals, 40),
        hotShower: Boolean(day.hotShower),
        signal: Boolean(day.signal),
        flushToilet: Boolean(day.flushToilet)
      })),
      claims: doc.claims
        ?.slice(0, 20)
        .map((claim) => ({
          id: claim.id,
          kind: oneOf(claim.kind, Object.values(CLAIM_KIND), CLAIM_KIND.PRO),
          area: oneOf(claim.area, Object.values(CLAIM_AREA), CLAIM_AREA.ITINERARY),
          text: text(claim.text, 140),
          detail: text(claim.detail, 200)
        }))
        .filter((claim) => claim.text),
      departures: doc.departures
        ?.slice(0, 60)
        .filter((departure) => /^\d{4}-\d{2}-\d{2}$/.test(departure.startDate))
        .map((departure) => ({
          id: departure.id,
          startDate: departure.startDate,
          seats: int(departure.seats, 1, maxGroup)
        }))
    };
  }

  /**
   * Saves the editor's plan in one transaction. Days are replaced. Claims and departures are matched
   * by id: a reworded promise loses its ratings (they judged different words — BR-09); past
   * departures and ones with bookings are never deleted, and seats never drop below those sold.
   * Edits to a published plan stay live; a new plan waits for review (submitPlan).
   */
  static async savePlan(doc: TPlanInput, operatorId: string) {
    const plan = await this.findOwnCheck(doc.id, operatorId);
    const { fields, dayItems, claims, departures } = this._validateInput(doc);
    const today = todayUb();

    await sequelize.transaction(async (transaction) => {
      // the first real title gives a draft a readable URL
      if (plan.slug.startsWith('new-plan-') && fields.titleEn)
        fields.slug = slugify(String(fields.titleEn), Date.now().toString(36).slice(-4));
      if (dayItems) {
        fields.days = dayItems.length;
        await PlanDayModel.destroy({ where: { planId: plan.id }, transaction });
        await PlanDayModel.bulkCreate(
          dayItems.map((day, index) => ({ ...day, planId: plan.id, dayNo: index + 1 })),
          { transaction }
        );
      }
      await plan.update(fields, { transaction });

      if (claims) {
        const old = new Map((plan.claims ?? []).map((claim) => [claim.id, claim]));
        const kept = claims.map((claim) => claim.id).filter((id) => id && old.has(id));
        await ClaimModel.destroy({
          where: { planId: plan.id, id: { [Op.notIn]: kept as string[] } },
          transaction
        });
        for (const [index, claim] of claims.entries()) {
          const previous = claim.id ? old.get(claim.id) : undefined;
          const values = { kind: claim.kind, area: claim.area, text: claim.text, detail: claim.detail, sort: index };
          if (!previous) {
            await ClaimModel.create({ ...values, planId: plan.id }, { transaction });
            continue;
          }
          if (previous.text !== claim.text)
            await ClaimRatingModel.destroy({ where: { claimId: previous.id }, transaction });
          await previous.update(values, { transaction });
        }
      }

      if (departures) {
        const old = new Map((plan.departures ?? []).map((d) => [d.id, d]));
        const kept = new Set(departures.map((d) => d.id).filter(Boolean));
        for (const departure of plan.departures ?? []) {
          const booked = await BookingModel.count({ where: { departureId: departure.id }, transaction });
          if (!kept.has(departure.id) && departure.startDate >= today && booked === 0)
            await departure.destroy({ transaction });
        }
        for (const departure of departures) {
          const previous = departure.id ? old.get(departure.id) : undefined;
          if (!previous) {
            await DepartureModel.create(
              { planId: plan.id, startDate: departure.startDate, seats: departure.seats },
              { transaction }
            );
            continue;
          }
          const sold = sum((previous.bookings ?? []).map((b) => b.pax));
          await previous.update(
            { startDate: departure.startDate, seats: Math.max(departure.seats, sold) },
            { transaction }
          );
        }
      }
    });
    return this.findIdCheck(plan.id);
  }

  /** Sends a finished draft to the review queue. A published plan's edits are already live. */
  static async submitPlan(id: string, operatorId: string) {
    const plan = await this.findOwnCheck(id, operatorId);
    if (!this.canSubmit(plan)) throw new Error('error.planIncomplete');
    if (plan.status !== PLAN_STATUS.PUBLISHED)
      await plan.update({
        status: PLAN_STATUS.PENDING,
        submittedAt: new Date(),
        reviewNote: ''
      });
    return plan;
  }

  /** An unverified agency can't go live, however good the plan is. */
  static async approvePlan(id: string) {
    const plan = await this.findIdCheck(id);
    if (plan.status !== PLAN_STATUS.PENDING) throw new Error('error.planNotPending');
    if (!plan.operator?.isVerified) throw new Error('error.operatorNotVerified');
    if (!this.canSubmit(plan)) throw new Error('error.planIncomplete');
    return plan.update({ status: PLAN_STATUS.PUBLISHED, reviewNote: '' });
  }

  static async requestFixes(id: string, note: string) {
    const plan = await this.findIdCheck(id);
    if (plan.status !== PLAN_STATUS.PENDING) throw new Error('error.planNotPending');
    return plan.update({
      status: PLAN_STATUS.NEEDS_FIXES,
      reviewNote: text(note, 500) || 'Please complete the checklist.'
    });
  }
}
