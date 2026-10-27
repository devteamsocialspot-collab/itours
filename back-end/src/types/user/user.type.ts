import { TPagination } from '../common.type';
import { ROLES } from './role.type';

export type TUser = {
  id: string;
  /** 8-digit Mongolian mobile; '' for a traveller who signed up by email. */
  phone: string;
  /** '' for an account made by phone. One of phone / email is always set. */
  email: string;
  password: string;
  name: string;
  role: ROLES;
  isActive: boolean;
  /** Shown next to a traveller's review ("Poland"). */
  country: string;
  /** The agency an OPERATOR works for; null for every other role. */
  operatorId: string | null;
  lastLoginAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
};

export type TUserCreate = Pick<TUser, 'phone' | 'password' | 'name'> &
  Partial<Pick<TUser, 'email' | 'country'>> & {
    role?: ROLES;
  };

export type TUserUpdate = { id: string } & Partial<
  TUserCreate & Pick<TUser, 'isActive'>
>;

/** Self sign-up. `login` is a phone or an email; a company name makes it an agency account. */
export type TRegister = {
  name: string;
  login: string;
  password: string;
  country?: string;
  companyName?: string;
};

export type TSearchUsers = TPagination &
  Partial<{
    search: string;
    orderBy: string;
    direction: string;
    role: ROLES;
    isActive: boolean;
  }>;
