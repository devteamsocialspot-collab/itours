import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import config from '../../config';

import sequelize from '../../config/database';
import { OperatorModel } from '../../models/operator/operator.model';
import { comparePassword, UserModel } from '../../models/user/user.model';

import {
  TJwtPayload,
  TPaginationGeneric,
  TTokenValue
} from '../../types/common.type';
import { ROLES, STAFF_ROLES } from '../../types/user/role.type';
import {
  TRegister,
  TSearchUsers,
  TUserCreate,
  TUserUpdate
} from '../../types/user/user.type';

import {
  ilikeAny,
  isEmail,
  isPhone,
  normalizeEmail,
  normalizePhone,
  pagination,
  parseLogin,
  slugify
} from '../../utils';

const { JWT_TOKEN_SALT } = config;

const MIN_PASSWORD = 6;
const TOKEN_TTL = '30d';
// allow-listed sort columns: client input never reaches SQL as-is
const ORDER_COLUMNS = ['createdAt', 'name', 'phone', 'role'];

export default class UserController {
  static async findIdCheck(id: string): Promise<UserModel> {
    const user = await UserModel.findByPk(id, {
      include: [{ model: OperatorModel, as: 'operator' }]
    });
    if (!user) throw new Error('error.userNotFound');
    return user;
  }

  /** Only a SUPER_ADMIN may create, edit or delete a SUPER_ADMIN. */
  static _checkRole(actorRole: ROLES, targetRole?: ROLES) {
    if (targetRole === ROLES.SUPER_ADMIN && actorRole !== ROLES.SUPER_ADMIN)
      throw new Error('error.forbidden');
  }

  static _checkPassword(password: string) {
    if (password.length < MIN_PASSWORD)
      throw new Error('error.passwordTooShort');
  }

  /** Throws when the phone or email already belongs to another account. */
  static async _checkFree(
    { phone, email }: { phone?: string; email?: string },
    exceptId?: string
  ) {
    const id = exceptId ? { id: { [Op.ne]: exceptId } } : {};
    if (phone && (await UserModel.findOne({ where: { phone, ...id } })))
      throw new Error('error.phoneTaken');
    if (email && (await UserModel.findOne({ where: { email, ...id } })))
      throw new Error('error.emailTaken');
  }

  static generateJwt(doc: TJwtPayload): string {
    if (!JWT_TOKEN_SALT) throw new Error('error.jwtNotConfigured');
    return jwt.sign(doc, JWT_TOKEN_SALT, { expiresIn: TOKEN_TTL });
  }

  /**
   * Builds the request context from the Authorization header. Never throws: a missing or refused
   * token is UNAUTH plus the reason, which @auth reports only on fields that need a user. The role
   * comes from the DB, not the token, and a disabled account is refused on its next request.
   */
  static async verifyJwt(
    authorization = ''
  ): Promise<Omit<TTokenValue, 'lang'>> {
    const token = authorization.replace(/^Bearer /, '');
    const unauth = (authError: string) => ({
      userId: null,
      userRole: ROLES.UNAUTH,
      authError
    });
    if (!token) return unauth('error.tokenEmpty');
    try {
      if (!JWT_TOKEN_SALT) throw new Error('error.jwtNotConfigured');
      let payload: TJwtPayload;
      try {
        payload = jwt.verify(token, JWT_TOKEN_SALT) as TJwtPayload;
      } catch {
        throw new Error('error.tokenInvalid');
      }
      const user = await UserModel.findByPk(payload.userId, {
        attributes: ['id', 'role', 'isActive']
      });
      if (!user) throw new Error('error.userNotFound');
      if (!user.isActive) throw new Error('error.userInactive');
      return { userId: user.id, userRole: user.role };
    } catch (error) {
      return unauth(error.message);
    }
  }

  /** `login` is an 8-digit phone or an email — staff and agencies use phones, foreign travellers email. */
  static async logIn(doc: { login: string; password: string }) {
    const where = parseLogin(doc.login);
    const user = where
      ? await UserModel.scope('withPassword').findOne({ where })
      : null;
    if (!user || !(await comparePassword(doc.password, user.password)))
      throw new Error('error.invalidCredentials');
    if (!user.isActive) throw new Error('error.userInactive');
    await user.update({ lastLoginAt: new Date() });
    return {
      user,
      token: this.generateJwt({ userId: user.id, userRole: user.role })
    };
  }

  /**
   * Self sign-up, signed in straight away. With a company name it is a travel agency: the account
   * becomes an OPERATOR of a new, unverified agency, whose plans can't go live until staff check the
   * licence. Without one it is a traveller (USER).
   */
  static async register(doc: TRegister) {
    const name = doc.name?.trim();
    if (!name) throw new Error('error.nameRequired');
    this._checkPassword(doc.password ?? '');
    const login = parseLogin(doc.login);
    if (!login) throw new Error('error.loginInvalid');
    await this._checkFree(login);
    const companyName = doc.companyName?.trim();
    if (doc.companyName != null && !companyName)
      throw new Error('error.companyRequired');

    const user = await sequelize.transaction(async (transaction) => {
      const operator = companyName
        ? await OperatorModel.create(
            {
              name: companyName,
              slug: slugify(companyName, Date.now().toString(36).slice(-4)),
              languages: ['Mongolian']
            },
            { transaction }
          )
        : null;
      return UserModel.create(
        {
          ...login,
          name,
          password: doc.password,
          country: doc.country?.trim() ?? '',
          role: operator ? ROLES.OPERATOR : ROLES.USER,
          operatorId: operator?.id ?? null,
          isActive: true,
          lastLoginAt: new Date()
        },
        { transaction }
      );
    });
    return {
      user,
      token: this.generateJwt({ userId: user.id, userRole: user.role })
    };
  }

  static async getUsers(
    doc: TSearchUsers
  ): Promise<TPaginationGeneric<UserModel>> {
    const { role, isActive, orderBy = '', direction } = doc;
    // the Staff screen: agencies and travellers are not staff
    const where: Record<string | symbol, unknown> = {
      role: role && STAFF_ROLES.includes(role) ? role : { [Op.in]: STAFF_ROLES }
    };
    if (isActive != null) where.isActive = isActive;
    const search = doc.search?.trim();
    if (search) where[Op.or] = ilikeAny(search, ['name', 'phone', 'email']);
    return UserModel.findAndCountAll({
      where,
      ...pagination(doc),
      order: [
        [
          ORDER_COLUMNS.includes(orderBy) ? orderBy : 'createdAt',
          direction?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'
        ]
      ]
    });
  }

  static async createUser(doc: TUserCreate, actorRole: ROLES) {
    this._checkRole(actorRole, doc.role);
    this._checkPassword(doc.password ?? '');
    const phone = normalizePhone(doc.phone);
    if (!phone) throw new Error('error.phoneRequired');
    if (!isPhone(phone)) throw new Error('error.phoneInvalid');
    const email = normalizeEmail(doc.email ?? '');
    if (email && !isEmail(email)) throw new Error('error.loginInvalid');
    await this._checkFree({ phone, email });
    return UserModel.create({
      ...doc,
      phone,
      email,
      role: doc.role ?? ROLES.MANAGER
    });
  }

  static async updateUser(doc: TUserUpdate, actorRole: ROLES) {
    const { id, ...input } = doc;
    const user = await this.findIdCheck(id);
    this._checkRole(actorRole, user.role);
    this._checkRole(actorRole, input.role);
    const params = Object.fromEntries(
      Object.entries(input).filter(([, value]) => value != null)
    ) as Omit<TUserUpdate, 'id'>;

    if (params.phone != null) {
      params.phone = normalizePhone(params.phone);
      if (!params.phone) throw new Error('error.phoneRequired');
      if (!isPhone(params.phone)) throw new Error('error.phoneInvalid');
    }
    if (params.email != null) {
      params.email = normalizeEmail(params.email);
      if (params.email && !isEmail(params.email))
        throw new Error('error.loginInvalid');
    }
    await this._checkFree({ phone: params.phone, email: params.email }, id);
    // empty = keep the current one
    if (!params.password) delete params.password;
    else this._checkPassword(params.password);

    return user.update(params);
  }

  static async deleteUser(doc: { id: string }, actor: TJwtPayload) {
    if (doc.id === actor.userId) throw new Error('error.cannotDeleteSelf');
    const user = await this.findIdCheck(doc.id);
    this._checkRole(actor.userRole, user.role);
    await user.destroy();
  }

  /** The agency an OPERATOR works for — every partner screen is scoped by it. */
  static async operatorIdOf(userId: string): Promise<string> {
    const user = await UserModel.findByPk(userId, {
      attributes: ['id', 'operatorId']
    });
    if (!user?.operatorId) throw new Error('error.notAnOperator');
    return user.operatorId;
  }
}
