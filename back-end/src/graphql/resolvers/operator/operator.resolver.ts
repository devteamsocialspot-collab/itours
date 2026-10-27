import OperatorController from '../../../controllers/operator/operator.controller';
import UserController from '../../../controllers/user/user.controller';

import { OperatorModel } from '../../../models/operator/operator.model';

import { TContextUser, TTokenValue } from '../../../types/common.type';

import { fail, ok } from '../../../utils';

export default {
  Query: {
    operators: async (_, __, context: TTokenValue) => {
      try {
        return {
          ...ok(context.lang),
          operators: await OperatorController.getOperators()
        };
      } catch (error) {
        return { ...fail(error, context.lang), operators: [] };
      }
    },
    operator: async (_, doc: { slug: string }, context: TTokenValue) => {
      try {
        return {
          ...ok(context.lang),
          operator: await OperatorController.getOperator(doc.slug)
        };
      } catch (error) {
        return { ...fail(error, context.lang), operator: null };
      }
    },
    adminOperators: async (_, __, context: TContextUser) => {
      try {
        return {
          ...ok(context.lang),
          operators: await OperatorController.getOperators({ all: true })
        };
      } catch (error) {
        return { ...fail(error, context.lang), operators: [] };
      }
    },
    myOperator: async (_, __, context: TContextUser) => {
      try {
        const operatorId = await UserController.operatorIdOf(context.userId);
        return {
          ...ok(context.lang),
          operator: await OperatorController.findIdCheck(operatorId)
        };
      } catch (error) {
        return { ...fail(error, context.lang), operator: null };
      }
    },
    partnerDashboard: async (_, doc: { days?: number }, context: TContextUser) => {
      try {
        const operatorId = await UserController.operatorIdOf(context.userId);
        return {
          ...ok(context.lang),
          dashboard: await OperatorController.getDashboard(operatorId, doc.days ?? 30)
        };
      } catch (error) {
        return { ...fail(error, context.lang), dashboard: null };
      }
    },
    marketplaceStats: async (_, __, context: TContextUser) => {
      try {
        return {
          ...ok(context.lang),
          stats: await OperatorController.getMarketplaceStats()
        };
      } catch (error) {
        return { ...fail(error, context.lang), stats: null };
      }
    }
  },
  Mutation: {
    updateMyOperator: async (_, doc, context: TContextUser) => {
      try {
        const operatorId = await UserController.operatorIdOf(context.userId);
        return {
          ...ok(context.lang, 'response.saved'),
          operator: await OperatorController.updateProfile(operatorId, doc)
        };
      } catch (error) {
        return { ...fail(error, context.lang), operator: null };
      }
    },
    createOperator: async (_, doc, context: TContextUser) => {
      try {
        return {
          ...ok(context.lang, 'response.operatorCreated'),
          operator: await OperatorController.createOperator(doc)
        };
      } catch (error) {
        return { ...fail(error, context.lang), operator: null };
      }
    },
    setOperatorVerified: async (_, doc, context: TContextUser) => {
      try {
        return {
          ...ok(context.lang, doc.isVerified ? 'response.verified' : 'response.unverified'),
          operator: await OperatorController.setVerified(doc.id, doc.isVerified)
        };
      } catch (error) {
        return { ...fail(error, context.lang), operator: null };
      }
    }
  },
  Operator: {
    // lazy: only the screens that show numbers pay for them
    stats: (operator: OperatorModel) => OperatorController.getStats(operator.id),
    health: async (operator: OperatorModel) =>
      OperatorController.healthOf(
        operator,
        await OperatorController.getStats(operator.id)
      )
  }
};
