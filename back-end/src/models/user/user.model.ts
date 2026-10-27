import { createHmac } from 'node:crypto';
import { compare, hash } from 'bcryptjs';
import { DataTypes, Model, Op, Sequelize } from 'sequelize';
import config from '../../config';
import { ROLES, ROLES_ENUM } from '../../types/user/role.type';
import { TUser } from '../../types/user/user.type';
import { OperatorModel } from '../operator/operator.model';

const { PASSWORD_HASH_SALT } = config;

// bcrypt only reads the first 72 bytes; pre-hashing keeps long passwords fully significant
const _preHash = (password: string) =>
  createHmac('sha256', password).digest('hex');
const _hashPassword = (password: string) =>
  hash(_preHash(password), PASSWORD_HASH_SALT);
export const comparePassword = (password: string, hashed: string) =>
  compare(_preHash(password), hashed);

export class UserModel extends Model implements TUser {
  public id!: string;
  public phone!: string;
  public email!: string;
  public password!: string;
  public name!: string;
  public role!: ROLES;
  public isActive!: boolean;
  public country!: string;
  public operatorId!: string | null;
  public lastLoginAt!: Date | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public operator?: OperatorModel;

  static associate(): void {
    //belongsTo
    this.belongsTo(OperatorModel, {
      foreignKey: 'operatorId',
      as: 'operator',
      onDelete: 'SET NULL'
    });
    //hasMany
    OperatorModel.hasMany(this, { foreignKey: 'operatorId', as: 'users' });
  }
}

export const createUserModel = (sequelize: Sequelize) => {
  UserModel.init(
    {
      id: {
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        type: DataTypes.UUID,
        allowNull: false
      },
      phone: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
      email: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
      password: { type: DataTypes.STRING, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      role: {
        type: DataTypes.ENUM,
        values: ROLES_ENUM,
        allowNull: false,
        defaultValue: ROLES.USER
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      country: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
      operatorId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'Operators', key: 'id' },
        onDelete: 'SET NULL'
      },
      lastLoginAt: { type: DataTypes.DATE, allowNull: true }
    },
    {
      sequelize,
      timestamps: true,
      tableName: 'Users',
      modelName: 'UserModel',
      defaultScope: { attributes: { exclude: ['password'] } },
      scopes: { withPassword: { attributes: { exclude: [] } } },
      // '' means "signed up the other way", so only filled values have to be unique
      indexes: [
        {
          unique: true,
          fields: ['phone'],
          name: 'users_phone_uniq',
          where: { phone: { [Op.ne]: '' } }
        },
        {
          unique: true,
          fields: ['email'],
          name: 'users_email_uniq',
          where: { email: { [Op.ne]: '' } }
        }
      ]
    }
  );

  UserModel.beforeCreate(async (user) => {
    if (user.password) user.password = await _hashPassword(user.password);
  });
  UserModel.beforeUpdate(async (user) => {
    if (user.changed('password'))
      user.password = await _hashPassword(user.password);
  });
};
