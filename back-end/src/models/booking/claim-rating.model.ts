import { DataTypes, Model, Sequelize } from 'sequelize';
import { TClaimRating } from '../../types/booking/booking.type';
import { ClaimModel } from '../plan/claim.model';
import { ReviewModel } from './review.model';

/** One promise, rated once per review. The raw material of every Expectation Score. */
export class ClaimRatingModel extends Model implements TClaimRating {
  public id!: string;
  public reviewId!: string;
  public claimId!: string;
  public score!: number;

  static associate(): void {
    //belongsTo
    this.belongsTo(ReviewModel, {
      foreignKey: 'reviewId',
      as: 'review',
      onDelete: 'CASCADE'
    });
    this.belongsTo(ClaimModel, {
      foreignKey: 'claimId',
      as: 'claim',
      onDelete: 'CASCADE'
    });
    //hasMany
    ReviewModel.hasMany(this, { foreignKey: 'reviewId', as: 'ratings' });
    ClaimModel.hasMany(this, { foreignKey: 'claimId', as: 'ratings' });
  }
}

export const createClaimRatingModel = (sequelize: Sequelize) => {
  ClaimRatingModel.init(
    {
      id: {
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        type: DataTypes.UUID,
        allowNull: false
      },
      reviewId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'Reviews', key: 'id' },
        onDelete: 'CASCADE'
      },
      claimId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'Claims', key: 'id' },
        onDelete: 'CASCADE'
      },
      score: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 0, max: 2 }
      }
    },
    {
      sequelize,
      timestamps: false,
      tableName: 'ClaimRatings',
      modelName: 'ClaimRatingModel',
      indexes: [
        // a promise is rated once per review
        {
          unique: true,
          fields: ['reviewId', 'claimId'],
          name: 'claim_ratings_uniq'
        },
        { fields: ['claimId'], name: 'claim_ratings_claim_idx' }
      ]
    }
  );
};
