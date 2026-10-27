import { DataTypes, Model, Sequelize } from 'sequelize';
import {
  AREA,
  DIFFICULTY,
  PLAN_STATUS,
  TPlan
} from '../../types/plan/plan.type';
import { OperatorModel } from '../operator/operator.model';
// type-only: a parent never imports its children at runtime, which keeps models/plan acyclic
import type { ClaimModel } from './claim.model';
import type { DepartureModel } from './departure.model';
import type { PlanDayModel } from './plan-day.model';

/** A trip plan an agency sells: the days, its own pros and cons, and the departures on sale. */
export class PlanModel extends Model implements TPlan {
  public id!: string;
  public operatorId!: string;
  public slug!: string;
  public titleEn!: string;
  public titleMn!: string;
  public region!: string;
  public area!: AREA;
  public season!: string;
  public days!: number;
  public minGroup!: number;
  public maxGroup!: number;
  public difficulty!: DIFFICULTY;
  public vehicle!: string;
  public sleeping!: string;
  public lodging!: string[];
  public summary!: string;
  public summaryMn!: string;
  public priceUsd!: number;
  public groupPriceUsd!: number | null;
  public groupPriceFrom!: number | null;
  public singleSupplement!: number | null;
  public included!: string[];
  public excluded!: string[];
  public photos!: string[];
  public freeCancelDays!: number;
  public totalKm!: number | null;
  public unpavedPct!: number | null;
  public status!: PLAN_STATUS;
  public reviewNote!: string;
  public submittedAt!: Date | null;
  public views!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // loaded with PlanController.INCLUDE; the derived fields are computed from them
  public operator?: OperatorModel;
  public dayItems?: PlanDayModel[];
  public claims?: ClaimModel[];
  public departures?: DepartureModel[];
  public reviews?: { stars: number }[];

  static associate(): void {
    //belongsTo
    this.belongsTo(OperatorModel, {
      foreignKey: 'operatorId',
      as: 'operator',
      onDelete: 'CASCADE'
    });
    //hasMany
    OperatorModel.hasMany(this, { foreignKey: 'operatorId', as: 'plans' });
  }
}

const list = (type: DataTypes.AbstractDataTypeConstructor = DataTypes.STRING) => ({
  type: DataTypes.ARRAY(type),
  allowNull: false,
  defaultValue: []
});

export const createPlanModel = (sequelize: Sequelize) => {
  PlanModel.init(
    {
      id: {
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        type: DataTypes.UUID,
        allowNull: false
      },
      operatorId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'Operators', key: 'id' },
        onDelete: 'CASCADE'
      },
      slug: { type: DataTypes.STRING, allowNull: false },
      titleEn: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
      titleMn: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
      region: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
      area: {
        type: DataTypes.ENUM,
        values: Object.values(AREA),
        allowNull: false,
        defaultValue: AREA.CENTRAL
      },
      season: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
      days: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      minGroup: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      maxGroup: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 8 },
      difficulty: {
        type: DataTypes.ENUM,
        values: Object.values(DIFFICULTY),
        allowNull: false,
        defaultValue: DIFFICULTY.EASY
      },
      vehicle: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
      sleeping: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
      lodging: list(),
      summary: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
      summaryMn: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
      priceUsd: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      groupPriceUsd: { type: DataTypes.INTEGER, allowNull: true },
      groupPriceFrom: { type: DataTypes.INTEGER, allowNull: true },
      singleSupplement: { type: DataTypes.INTEGER, allowNull: true },
      included: list(DataTypes.TEXT),
      excluded: list(DataTypes.TEXT),
      // links can run long (CDN paths with query strings), so TEXT, like every URL column
      photos: list(DataTypes.TEXT),
      freeCancelDays: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 21
      },
      totalKm: { type: DataTypes.INTEGER, allowNull: true },
      unpavedPct: { type: DataTypes.INTEGER, allowNull: true },
      status: {
        type: DataTypes.ENUM,
        values: Object.values(PLAN_STATUS),
        allowNull: false,
        defaultValue: PLAN_STATUS.DRAFT
      },
      reviewNote: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
      submittedAt: { type: DataTypes.DATE, allowNull: true },
      views: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
    },
    {
      sequelize,
      timestamps: true,
      tableName: 'Plans',
      modelName: 'PlanModel',
      indexes: [
        { unique: true, fields: ['slug'], name: 'plans_slug_uniq' },
        { fields: ['operatorId', 'status'], name: 'plans_operator_status_idx' }
      ]
    }
  );
};
