import config from '../../../config';
import OperatorController from '../../../controllers/operator/operator.controller';
import PlanController from '../../../controllers/plan/plan.controller';
import UserController from '../../../controllers/user/user.controller';

import { OperatorModel } from '../../../models/operator/operator.model';
import { PlanModel } from '../../../models/plan/plan.model';

import { TContextUser, TTokenValue } from '../../../types/common.type';
import { PLAN_STATUS } from '../../../types/plan/plan.type';

import { fail, ok } from '../../../utils';
import { t } from '../../../utils/i18n';

const { MNT_PER_USD, COMMISSION_PERCENT } = config;

/** Derived fields need what PlanController.include() loads; a bare plan gets it on first ask. */
const full = (plan: PlanModel) => PlanController._full(plan);

export default {
  Query: {
    plans: async (_, doc, context: TTokenValue) => {
      try {
        const { rows, count, facets } = await PlanController.getPlans(doc);
        return { ...ok(context.lang), plans: rows, count, facets };
      } catch (error) {
        return { ...fail(error, context.lang), plans: [], count: 0, facets: [] };
      }
    },
    plan: async (_, doc: { slug: string }, context: TTokenValue) => {
      try {
        return {
          ...ok(context.lang),
          plan: await PlanController.getPlan(doc.slug, context)
        };
      } catch (error) {
        return { ...fail(error, context.lang), plan: null };
      }
    },
    siteInfo: async (_, __, context: TTokenValue) => {
      try {
        const { verifiedOperators } = await OperatorController.getMarketplaceStats();
        return {
          ...ok(context.lang),
          info: {
            verifiedOperators,
            publishedPlans: await PlanModel.count({
              where: { status: PLAN_STATUS.PUBLISHED }
            }),
            mntPerUsd: MNT_PER_USD,
            commissionPercent: COMMISSION_PERCENT
          }
        };
      } catch (error) {
        return { ...fail(error, context.lang), info: null };
      }
    },
    savedPlans: async (_, __, context: TContextUser) => {
      try {
        const plans = await PlanController.getSavedPlans(context.userId);
        return { ...ok(context.lang), plans, count: plans.length, facets: [] };
      } catch (error) {
        return { ...fail(error, context.lang), plans: [], count: 0, facets: [] };
      }
    },
    partnerPlans: async (_, __, context: TContextUser) => {
      try {
        const operatorId = await UserController.operatorIdOf(context.userId);
        const plans = await PlanController.getOperatorPlans(operatorId);
        return { ...ok(context.lang), plans, count: plans.length, facets: [] };
      } catch (error) {
        return { ...fail(error, context.lang), plans: [], count: 0, facets: [] };
      }
    },
    partnerPlan: async (_, doc: { id: string }, context: TContextUser) => {
      try {
        const operatorId = await UserController.operatorIdOf(context.userId);
        return {
          ...ok(context.lang),
          plan: await PlanController.findOwnCheck(doc.id, operatorId)
        };
      } catch (error) {
        return { ...fail(error, context.lang), plan: null };
      }
    },
    reviewQueue: async (_, __, context: TContextUser) => {
      try {
        const plans = await PlanController.getReviewQueue();
        return { ...ok(context.lang), plans, count: plans.length, facets: [] };
      } catch (error) {
        return { ...fail(error, context.lang), plans: [], count: 0, facets: [] };
      }
    }
  },
  Mutation: {
    toggleSavePlan: async (_, doc: { planId: string }, context: TContextUser) => {
      try {
        const saved = await PlanController.toggleSave(doc.planId, context.userId);
        return {
          ...ok(context.lang, saved ? 'response.planSaved' : 'response.planUnsaved'),
          saved
        };
      } catch (error) {
        return { ...fail(error, context.lang), saved: null };
      }
    },
    createPlan: async (_, __, context: TContextUser) => {
      try {
        const operatorId = await UserController.operatorIdOf(context.userId);
        return {
          ...ok(context.lang, 'response.created'),
          plan: await PlanController.createPlan(operatorId)
        };
      } catch (error) {
        return { ...fail(error, context.lang), plan: null };
      }
    },
    savePlan: async (_, doc, context: TContextUser) => {
      try {
        const operatorId = await UserController.operatorIdOf(context.userId);
        return {
          ...ok(context.lang, 'response.saved'),
          plan: await PlanController.savePlan(doc, operatorId)
        };
      } catch (error) {
        return { ...fail(error, context.lang), plan: null };
      }
    },
    submitPlan: async (_, doc: { id: string }, context: TContextUser) => {
      try {
        const operatorId = await UserController.operatorIdOf(context.userId);
        const plan = await PlanController.submitPlan(doc.id, operatorId);
        return {
          ...ok(
            context.lang,
            plan.status === PLAN_STATUS.PUBLISHED ? 'response.planLive' : 'response.planSubmitted'
          ),
          plan
        };
      } catch (error) {
        return { ...fail(error, context.lang), plan: null };
      }
    },
    approvePlan: async (_, doc: { id: string }, context: TContextUser) => {
      try {
        return {
          ...ok(context.lang, 'response.planApproved'),
          plan: await PlanController.approvePlan(doc.id)
        };
      } catch (error) {
        return { ...fail(error, context.lang), plan: null };
      }
    },
    requestPlanFixes: async (_, doc: { id: string; note?: string }, context: TContextUser) => {
      try {
        return {
          ...ok(context.lang, 'response.fixesRequested'),
          plan: await PlanController.requestFixes(doc.id, doc.note ?? '')
        };
      } catch (error) {
        return { ...fail(error, context.lang), plan: null };
      }
    }
  },
  Plan: {
    operator: (plan: PlanModel) =>
      plan.operator ?? OperatorModel.findByPk(plan.operatorId),
    dayItems: async (plan: PlanModel) => PlanController.getDays(await full(plan)),
    claims: async (plan: PlanModel) =>
      PlanController.getClaims(await full(plan)).map((claim) => ({
        id: claim.id,
        kind: claim.kind,
        area: claim.area,
        text: claim.text,
        detail: claim.detail,
        sort: claim.sort,
        score: PlanController.claimScore(claim),
        ratingCount: claim.ratings?.length ?? 0
      })),
    departures: async (plan: PlanModel) => PlanController.getUpcoming(await full(plan)),
    score: async (plan: PlanModel) => PlanController.getScore(await full(plan)),
    areas: async (plan: PlanModel) => PlanController.areaScores((await full(plan)).claims ?? []),
    ratingCount: async (plan: PlanModel) =>
      ((await full(plan)).claims ?? []).reduce((n, claim) => n + (claim.ratings?.length ?? 0), 0),
    reviewCount: async (plan: PlanModel) => (await full(plan)).reviews?.length ?? 0,
    stars: async (plan: PlanModel) => PlanController.getStars(await full(plan)),
    maxDrive: async (plan: PlanModel) => PlanController.getComfort(await full(plan)).maxDrive,
    driveTotal: async (plan: PlanModel) => PlanController.getComfort(await full(plan)).driveTotal,
    showerNights: async (plan: PlanModel) => PlanController.getComfort(await full(plan)).showerNights,
    flushNights: async (plan: PlanModel) => PlanController.getComfort(await full(plan)).flushNights,
    nightCount: async (plan: PlanModel) => PlanController.getComfort(await full(plan)).nightCount,
    checks: async (plan: PlanModel, _, context: TTokenValue) =>
      PlanController.getChecks(await full(plan)).map((check) => ({
        ...check,
        label: t(check.key, context.lang, check.vars)
      })),
    canSubmit: async (plan: PlanModel) => PlanController.canSubmit(await full(plan))
  },
  Departure: {
    // a plan's departures carry it; a booking's departure doesn't need it
    left: (departure: { left?: number }) => departure.left ?? null
  }
};
