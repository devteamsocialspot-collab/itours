import { DataTypes, Model, Sequelize } from 'sequelize';
import { TPlanDay } from '../../types/plan/plan.type';
import { PlanModel } from './plan.model';

/** One day of a plan. The comfort facts here (drive, shower, signal, toilet) feed the search filters. */
export class PlanDayModel extends Model implements TPlanDay {
  public id!: string;
  public planId!: string;
  public dayNo!: number;
  public place!: string;
  public title!: string;
  public description!: string;
  public driveHours!: number | null;
  public sleeping!: string;
  public meals!: string;
  public hotShower!: boolean;
  public signal!: boolean;
  public flushToilet!: boolean;

  static associate(): void {
    //belongsTo
    this.belongsTo(PlanModel, {
      foreignKey: 'planId',
      as: 'plan',
      onDelete: 'CASCADE'
    });
    //hasMany
    PlanModel.hasMany(this, { foreignKey: 'planId', as: 'dayItems' });
  }
}

export const createPlanDayModel = (sequelize: Sequelize) => {
  PlanDayModel.init(
    {
      id: {
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        type: DataTypes.UUID,
        allowNull: false
      },
      planId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'Plans', key: 'id' },
        onDelete: 'CASCADE'
      },
      dayNo: { type: DataTypes.INTEGER, allowNull: false },
      place: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
      title: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
      description: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
      driveHours: { type: DataTypes.FLOAT, allowNull: true },
      sleeping: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
      meals: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
      hotShower: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      signal: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      flushToilet: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }
    },
    {
      sequelize,
      timestamps: false,
      tableName: 'PlanDays',
      modelName: 'PlanDayModel',
      indexes: [{ fields: ['planId', 'dayNo'], name: 'plan_days_plan_idx' }]
    }
  );
};
