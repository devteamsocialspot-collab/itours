import { DataTypes, Model, Sequelize } from 'sequelize';
import { TDeparture } from '../../types/plan/plan.type';
import { PlanModel } from './plan.model';

/** A date a plan leaves on. Seats left are counted from its bookings, never stored. */
export class DepartureModel extends Model implements TDeparture {
  public id!: string;
  public planId!: string;
  public startDate!: string;
  public seats!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // loaded with the plan: the travellers on each live booking
  public bookings?: { pax: number }[];

  static associate(): void {
    //belongsTo
    this.belongsTo(PlanModel, {
      foreignKey: 'planId',
      as: 'plan',
      onDelete: 'CASCADE'
    });
    //hasMany
    PlanModel.hasMany(this, { foreignKey: 'planId', as: 'departures' });
  }
}

export const createDepartureModel = (sequelize: Sequelize) => {
  DepartureModel.init(
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
      startDate: { type: DataTypes.DATEONLY, allowNull: false },
      seats: { type: DataTypes.INTEGER, allowNull: false }
    },
    {
      sequelize,
      timestamps: true,
      tableName: 'Departures',
      modelName: 'DepartureModel',
      indexes: [{ fields: ['planId', 'startDate'], name: 'departures_plan_date_idx' }]
    }
  );
};
