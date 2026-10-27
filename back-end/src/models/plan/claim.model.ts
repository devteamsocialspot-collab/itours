import { DataTypes, Model, Sequelize } from 'sequelize';
import { CLAIM_AREA, CLAIM_KIND, TClaim } from '../../types/plan/plan.type';
import { PlanModel } from './plan.model';

/** A pro or a con the operator wrote. Its ratings are what the Expectation Score is made of. */
export class ClaimModel extends Model implements TClaim {
  public id!: string;
  public planId!: string;
  public kind!: CLAIM_KIND;
  public area!: CLAIM_AREA;
  public text!: string;
  public detail!: string;
  public sort!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // loaded with the plan; only the scores are selected
  public ratings?: { score: number }[];

  static associate(): void {
    //belongsTo
    this.belongsTo(PlanModel, {
      foreignKey: 'planId',
      as: 'plan',
      onDelete: 'CASCADE'
    });
    //hasMany
    PlanModel.hasMany(this, { foreignKey: 'planId', as: 'claims' });
  }
}

export const createClaimModel = (sequelize: Sequelize) => {
  ClaimModel.init(
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
      kind: {
        type: DataTypes.ENUM,
        values: Object.values(CLAIM_KIND),
        allowNull: false
      },
      area: {
        type: DataTypes.ENUM,
        values: Object.values(CLAIM_AREA),
        allowNull: false,
        defaultValue: CLAIM_AREA.ITINERARY
      },
      text: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
      detail: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
      sort: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
    },
    {
      sequelize,
      timestamps: true,
      tableName: 'Claims',
      modelName: 'ClaimModel',
      indexes: [{ fields: ['planId'], name: 'claims_plan_idx' }]
    }
  );
};
