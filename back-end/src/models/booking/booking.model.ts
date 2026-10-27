import { DataTypes, Model, Sequelize } from 'sequelize';
import {
  BOOKING_STATUS,
  PAY_METHOD,
  ROOM,
  TBooking
} from '../../types/booking/booking.type';
import { ROLES } from '../../types/user/role.type';
import { DepartureModel } from '../plan/departure.model';
import { PlanModel } from '../plan/plan.model';
import { UserModel } from '../user/user.model';
// type-only: the review is the child and declares this side itself
import type { ReviewModel } from './review.model';

/** Seats on one departure. Money history: plans and departures can't cascade it away. */
export class BookingModel extends Model implements TBooking {
  public id!: string;
  public code!: string;
  public userId!: string;
  public planId!: string;
  public departureId!: string;
  public pax!: number;
  public room!: ROOM;
  public totalUsd!: number;
  public method!: PAY_METHOD;
  public status!: BOOKING_STATUS;
  public notes!: string;
  public guide!: string;
  public driver!: string;
  public acceptedTradeoffs!: boolean;
  public cancelledBy!: ROLES | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public traveller?: UserModel;
  public plan?: PlanModel;
  public departure?: DepartureModel;
  public review?: ReviewModel | null;

  static associate(): void {
    //belongsTo
    this.belongsTo(UserModel, {
      foreignKey: 'userId',
      as: 'traveller',
      onDelete: 'RESTRICT'
    });
    this.belongsTo(PlanModel, {
      foreignKey: 'planId',
      as: 'plan',
      onDelete: 'RESTRICT'
    });
    this.belongsTo(DepartureModel, {
      foreignKey: 'departureId',
      as: 'departure',
      onDelete: 'RESTRICT'
    });
    //hasMany
    UserModel.hasMany(this, { foreignKey: 'userId', as: 'bookings' });
    PlanModel.hasMany(this, { foreignKey: 'planId', as: 'bookings' });
    DepartureModel.hasMany(this, { foreignKey: 'departureId', as: 'bookings' });
  }
}

const restrict = (model: string) => ({
  type: DataTypes.UUID,
  allowNull: false,
  references: { model, key: 'id' },
  onDelete: 'RESTRICT'
});

export const createBookingModel = (sequelize: Sequelize) => {
  BookingModel.init(
    {
      id: {
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        type: DataTypes.UUID,
        allowNull: false
      },
      code: { type: DataTypes.STRING, allowNull: false },
      userId: restrict('Users'),
      planId: restrict('Plans'),
      departureId: restrict('Departures'),
      pax: { type: DataTypes.INTEGER, allowNull: false },
      room: {
        type: DataTypes.ENUM,
        values: Object.values(ROOM),
        allowNull: false,
        defaultValue: ROOM.TWIN
      },
      totalUsd: { type: DataTypes.INTEGER, allowNull: false },
      method: {
        type: DataTypes.ENUM,
        values: Object.values(PAY_METHOD),
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM,
        values: Object.values(BOOKING_STATUS),
        allowNull: false,
        defaultValue: BOOKING_STATUS.PAID
      },
      notes: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
      guide: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
      driver: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
      acceptedTradeoffs: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      cancelledBy: {
        type: DataTypes.ENUM,
        values: [ROLES.USER, ROLES.OPERATOR, ROLES.MANAGER],
        allowNull: true
      }
    },
    {
      sequelize,
      timestamps: true,
      tableName: 'Bookings',
      modelName: 'BookingModel',
      indexes: [
        { unique: true, fields: ['code'], name: 'bookings_code_uniq' },
        { fields: ['departureId', 'status'], name: 'bookings_departure_idx' },
        { fields: ['userId'], name: 'bookings_user_idx' }
      ]
    }
  );
};
