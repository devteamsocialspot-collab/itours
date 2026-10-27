export enum ROLES {
  SUPER_ADMIN = 'SUPER_ADMIN',
  // marketplace staff: reviews plans, verifies agencies, watches operator health
  MANAGER = 'MANAGER',
  // a travel agency account; sees only its own company's plans and orders
  OPERATOR = 'OPERATOR',
  // a traveller: books seats and rates the trip afterwards
  USER = 'USER',
  // never stored: the context of a request without a valid token
  UNAUTH = 'UNAUTH'
}

/** Roles that run itours from /admin — the Staff screen lists only these. */
export const STAFF_ROLES = [ROLES.SUPER_ADMIN, ROLES.MANAGER];

/** What a Users row can hold — every role but UNAUTH. */
export const ROLES_ENUM = Object.values(ROLES).filter(
  (role) => role !== ROLES.UNAUTH
);
