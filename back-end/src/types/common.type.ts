import type { Locale } from '../utils/i18n';
import { ROLES } from './user/role.type';

/** Signed into the JWT. */
export type TJwtPayload = {
  userId: string;
  userRole: ROLES;
};

/** The Apollo context: the verified user, or UNAUTH plus the reason the token was refused. */
export type TTokenValue = {
  userId: string | null;
  userRole: ROLES;
  authError?: string;
  lang: Locale;
};

/** What a resolver behind @auth / @authLogin receives. */
export type TContextUser = {
  userId: string;
  userRole: ROLES;
  lang: Locale;
};

export type TPagination = {
  limit?: number;
  offset?: number;
};

export type TPaginationGeneric<T> = {
  rows: Array<T>;
  count: number;
};

export type TValidateResponse<
  isCreate extends boolean,
  T
> = isCreate extends true ? T : Partial<T>;
