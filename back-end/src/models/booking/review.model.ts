import { DataTypes, Model, Sequelize } from 'sequelize';
import { TReview } from '../../types/booking/booking.type';
import { PlanModel } from '../plan/plan.model';
import { UserModel } from '../user/user.model';
import { BookingModel } from './booking.model';
// type-only: the rating is the child and declares this side itself
import type { ClaimRatingModel } from './claim-rating.model';

/**
 * A traveller's word after the trip: stars, text, and a rating for every promise of the plan.
 * userId and planId repeat the booking's so a plan's reviews are one indexed query.
 */
export class ReviewModel extends Model implements TReview {
  public id!: string;
  public bookingId!: string;
  public userId!: string;
  public planId!: string;
  public stars!: number;
  public text!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public traveller?: UserModel;
  public booking?: BookingModel;
  public plan?: PlanModel;
  public ratings?: ClaimRatingModel[];

  static associate(): void {
    //belongsTo
    this.belongsTo(BookingModel, {
      foreignKey: 'bookingId',
      as: 'booking',
      onDelete: 'CASCADE'
    });
    this.belongsTo(UserModel, {
      foreignKey: 'userId',
      as: 'traveller',
      onDelete: 'CASCADE'
    });
    this.belongsTo(PlanModel, {
      foreignKey: 'planId',
      as: 'plan',
      onDelete: 'CASCADE'
    });
    //hasOne / hasMany
    BookingModel.hasOne(this, { foreignKey: 'bookingId', as: 'review' });
    PlanModel.hasMany(this, { foreignKey: 'planId', as: 'reviews' });
  }
}

export const createReviewModel = (sequelize: Sequelize) => {
  ReviewModel.init(
    {
      id: {
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        type: DataTypes.UUID,
        allowNull: false
      },
      bookingId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'Bookings', key: 'id' },
        onDelete: 'CASCADE'
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE'
      },
      planId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'Plans', key: 'id' },
        onDelete: 'CASCADE'
      },
      stars: { type: DataTypes.INTEGER, allowNull: false },
      text: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' }
    },
    {
      sequelize,
      timestamps: true,
      tableName: 'Reviews',
      modelName: 'ReviewModel',
      indexes: [
        // one review per booking (BR-08)
        { unique: true, fields: ['bookingId'], name: 'reviews_booking_uniq' },
        { fields: ['planId'], name: 'reviews_plan_idx' }
      ]
    }
  );
};
