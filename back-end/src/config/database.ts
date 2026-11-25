import { Options, Sequelize, Transaction } from 'sequelize';
import config from '.';
import { setupModel } from '../models/database';
import { clearCatalogue } from '../utils/catalogue';

const {
  POSTGRES_DB_NAME,
  POSTGRES_DB_USERNAME,
  POSTGRES_DB_HOST,
  POSTGRES_DB_PORT,
  POSTGRES_DB_PASSWORD,
  POSTGRES_SYNC_ON_START,
  POSTGRES_SYNC_ALTER
} = config;

const options: Options = {
  username: POSTGRES_DB_USERNAME,
  password: POSTGRES_DB_PASSWORD,
  database: POSTGRES_DB_NAME,
  port: POSTGRES_DB_PORT,
  dialect: 'postgres',
  host: POSTGRES_DB_HOST,
  timezone: '+08:00', // Ulaanbaatar
  logging: false
};

const sequelize = new Sequelize(options);
setupModel(sequelize);

// Any write empties the cached catalogue: after the commit when it runs inside a transaction, so a read
// racing that transaction can't put the old rows back. Every hook passes its options last.
const clearAfterWrite = (...args: unknown[]) => {
  const options = args[args.length - 1] as { transaction?: Transaction | null } | undefined;
  if (options?.transaction) options.transaction.afterCommit(clearCatalogue);
  else clearCatalogue();
};
sequelize.addHook('afterCreate', clearAfterWrite);
sequelize.addHook('afterUpdate', clearAfterWrite);
sequelize.addHook('afterDestroy', clearAfterWrite);
sequelize.addHook('afterUpsert', clearAfterWrite);
sequelize.addHook('afterBulkCreate', clearAfterWrite);
sequelize.addHook('afterBulkUpdate', clearAfterWrite);
sequelize.addHook('afterBulkDestroy', clearAfterWrite);

export default sequelize;

const MAX_RETRIES = 5;
const RETRY_DELAY = 5000;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const connectDatabase = async () => {
  for (let attempt = 1; ; attempt++) {
    try {
      await sequelize.authenticate();
      break;
    } catch (error) {
      console.error(
        `❌ DB connection failed (${attempt}/${MAX_RETRIES}): ${error.message}`
      );
      if (attempt >= MAX_RETRIES) throw error;
      await sleep(RETRY_DELAY);
    }
  }
  console.log('Database successfully connected 😸');

  if (POSTGRES_SYNC_ON_START) {
    // per-model sync so one failing table doesn't block the rest
    for (const [name, model] of Object.entries(sequelize.models)) {
      await model
        .sync({ alter: POSTGRES_SYNC_ALTER })
        .catch((err) => console.error(`❌ ${name}`, err.message));
    }
  }

  await runMigrations();
};

/**
 * Schema changes for databases that already exist. Only **columns** belong here: sync() creates a
 * missing table but adds a column only under `alter`, which we keep off.
 *
 * Enums are not our problem — sync() runs Sequelize's ensureEnums() on every boot, including for a
 * table that already exists and without `alter`, so a new enum type is created and a new enum value
 * is appended for us. A fresh database gets its enums complete from createTable.
 *
 * Every statement is idempotent and only warns on failure, so a half-applied migration can never
 * stop the server coming up.
 */
const MIGRATIONS: [string, string][] = [
  [
    'bookings-payments',
    `ALTER TABLE "Bookings"
      ADD COLUMN IF NOT EXISTS "qpayInvoiceId" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "stripeSessionId" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "paymentRef" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "payLink" JSONB`
  ]
];

const runMigrations = async () => {
  for (const [name, sql] of MIGRATIONS) {
    try {
      await sequelize.query(sql);
    } catch (error) {
      console.warn(`⚠️ migration ${name}: ${error.message}`);
    }
  }
};
