import { DataTypes, Model, Sequelize } from 'sequelize';
import { TOperator } from '../../types/operator/operator.type';

/** A travel agency. Its users, plans and bookings hang off it; it imports none of them. */
export class OperatorModel extends Model implements TOperator {
  public id!: string;
  public slug!: string;
  public name!: string;
  public licenceNo!: string;
  public city!: string;
  public foundedYear!: number | null;
  public about!: string;
  public languages!: string[];
  public fleet!: string;
  public isVerified!: boolean;
  public replyHours!: number;
  public color!: string;
  public coverUrl!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export const createOperatorModel = (sequelize: Sequelize) => {
  OperatorModel.init(
    {
      id: {
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        type: DataTypes.UUID,
        allowNull: false
      },
      slug: { type: DataTypes.STRING, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      licenceNo: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
      city: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Ulaanbaatar'
      },
      foundedYear: { type: DataTypes.INTEGER, allowNull: true },
      about: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
      languages: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: []
      },
      fleet: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
      isVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      replyHours: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 4 },
      color: { type: DataTypes.STRING, allowNull: false, defaultValue: '#004068' },
      coverUrl: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' }
    },
    {
      sequelize,
      timestamps: true,
      tableName: 'Operators',
      modelName: 'OperatorModel',
      indexes: [{ unique: true, fields: ['slug'], name: 'operators_slug_uniq' }]
    }
  );
};
