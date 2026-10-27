import UserController from '../../../controllers/user/user.controller';

import { OperatorModel } from '../../../models/operator/operator.model';
import { UserModel } from '../../../models/user/user.model';

import { TContextUser, TTokenValue } from '../../../types/common.type';

import { fail, ok } from '../../../utils';

export default {
  Query: {
    currentUser: async (_, __, context: TContextUser) => {
      try {
        return {
          ...ok(context.lang),
          user: await UserController.findIdCheck(context.userId)
        };
      } catch (error) {
        return { ...fail(error, context.lang), user: null };
      }
    },
    users: async (_, doc, context: TContextUser) => {
      try {
        const { rows, count } = await UserController.getUsers(doc);
        return { ...ok(context.lang), users: rows, count };
      } catch (error) {
        return { ...fail(error, context.lang), users: [], count: 0 };
      }
    }
  },
  Mutation: {
    loginUser: async (_, doc, context: TTokenValue) => {
      try {
        const { user, token } = await UserController.logIn(doc);
        return { ...ok(context.lang, 'response.loginOk'), user, token };
      } catch (error) {
        return { ...fail(error, context.lang), user: null, token: null };
      }
    },
    registerUser: async (_, doc, context: TTokenValue) => {
      try {
        const { user, token } = await UserController.register(doc);
        return { ...ok(context.lang, 'response.registered'), user, token };
      } catch (error) {
        return { ...fail(error, context.lang), user: null, token: null };
      }
    },
    createUser: async (_, doc, context: TContextUser) => {
      try {
        return {
          ...ok(context.lang, 'response.created'),
          user: await UserController.createUser(doc, context.userRole)
        };
      } catch (error) {
        return { ...fail(error, context.lang), user: null };
      }
    },
    updateUser: async (_, doc, context: TContextUser) => {
      try {
        return {
          ...ok(context.lang, 'response.updated'),
          user: await UserController.updateUser(doc, context.userRole)
        };
      } catch (error) {
        return { ...fail(error, context.lang), user: null };
      }
    },
    deleteUser: async (_, doc, context: TContextUser) => {
      try {
        await UserController.deleteUser(doc, context);
        return ok(context.lang, 'response.deleted');
      } catch (error) {
        return fail(error, context.lang);
      }
    }
  },
  User: {
    // already loaded by findIdCheck; a user listed from elsewhere looks it up only when asked
    operator: (user: UserModel) =>
      user.operator ??
      (user.operatorId ? OperatorModel.findByPk(user.operatorId) : null)
  }
};
