import { DataTypes, Model, Sequelize } from 'sequelize';
import { TSavedPlan } from '../../types/plan/plan.type';
import { UserModel } from '../user/user.model';
import { PlanModel } from './plan.model';

/** A traveller's shortlist; the compare table reads it. */
export class SavedPlanModel extends Model implements TSavedPlan {
  public id!: string;
  public userId!: string;
  public planId!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public plan?: PlanModel;

  static associate(): void {
    //belongsTo
    this.belongsTo(UserModel, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE'
    });
    this.belongsTo(PlanModel, {
      foreignKey: 'planId',
      as: 'plan',
      onDelete: 'CASCADE'
    });
  }
}

export const createSavedPlanModel = (sequelize: Sequelize) => {
  SavedPlanModel.init(
    {
      id: {
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        type: DataTypes.UUID,
        allowNull: false
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
      }
    },
    {
      sequelize,
      timestamps: true,
      tableName: 'SavedPlans',
      modelName: 'SavedPlanModel',
      indexes: [
        { unique: true, fields: ['userId', 'planId'], name: 'saved_plans_uniq' }
      ]
    }
  );
};
