import { getDirective, MapperKind, mapSchema } from '@graphql-tools/utils';
import {
  defaultFieldResolver,
  GraphQLFieldConfig,
  GraphQLSchema
} from 'graphql';
import { TTokenValue } from '../types/common.type';
import { ROLES } from '../types/user/role.type';
import { t } from '../utils/i18n';

/**
 * Wraps a field so it only runs for a signed-in user, and — when `permissions` is given — only for
 * one of those roles. SUPER_ADMIN always passes. Failures come back as the { success: false,
 * message } envelope, never as a GraphQL error.
 */
const _guard = (
  fieldConfig: GraphQLFieldConfig<unknown, TTokenValue>,
  permissions?: string[]
) => {
  const { resolve = defaultFieldResolver } = fieldConfig;
  fieldConfig.resolve = (root, args, context, info) => {
    try {
      const { userRole } = context;
      if (userRole === ROLES.UNAUTH)
        throw new Error(context.authError || 'error.tokenEmpty');
      if (
        permissions &&
        userRole !== ROLES.SUPER_ADMIN &&
        !permissions.includes(userRole)
      )
        throw new Error('error.forbidden');
      return resolve(root, args, context, info);
    } catch (error) {
      return { success: false, message: t(error.message, context.lang) };
    }
  };
  return fieldConfig;
};

/** @auth(permissions: [...]) — signed in with one of the listed roles. */
export function authDirective(schema: GraphQLSchema, directiveName: string) {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const directive = getDirective(schema, fieldConfig, directiveName)?.[0];
      return directive
        ? _guard(fieldConfig, directive.permissions ?? [])
        : fieldConfig;
    }
  });
}

/** @authLogin — signed in, any role. */
export function authLogin(schema: GraphQLSchema, directiveName: string) {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) =>
      getDirective(schema, fieldConfig, directiveName)?.[0]
        ? _guard(fieldConfig)
        : fieldConfig
  });
}
