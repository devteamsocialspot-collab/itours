import dotenv from 'dotenv';

// `pnpm dev` copies .env.local to .env first. Real environment variables (docker / pm2) always win.
dotenv.config({ quiet: true });

/** The only place process.env is read. */
export default {
  PORT: parseInt(process.env.PORT || '8080'),
  NODE_ENV: process.env.NODE_ENV || 'development',

  POSTGRES_DB_NAME: process.env.POSTGRES_DB_NAME || '',
  POSTGRES_DB_USERNAME: process.env.POSTGRES_DB_USERNAME || '',
  POSTGRES_DB_PASSWORD: process.env.POSTGRES_DB_PASSWORD || '',
  POSTGRES_DB_HOST: process.env.POSTGRES_DB_HOST || 'localhost',
  POSTGRES_DB_PORT: parseInt(process.env.POSTGRES_DB_PORT || '5432'),
  /** model.sync() for every model at boot. Dev: true. Prod: false (schema changes are hand-written SQL). */
  POSTGRES_SYNC_ON_START: process.env.POSTGRES_SYNC_ON_START === 'true',
  /** sync({ alter: true }) lets Sequelize ALTER existing tables — only flip on deliberately. */
  POSTGRES_SYNC_ALTER: process.env.POSTGRES_SYNC_ALTER === 'true',

  /** bcrypt cost factor. */
  PASSWORD_HASH_SALT: parseInt(process.env.PASSWORD_HASH_SALT || '10'),
  /** JWT signing secret. Empty = login and token checks fail loudly, never silently open. */
  JWT_TOKEN_SALT: process.env.JWT_TOKEN_SALT || '',

  /** The marketplace's cut of every booking; the operator is paid out the rest after the trip. */
  COMMISSION_PERCENT: parseFloat(process.env.COMMISSION_PERCENT || '5'),
  // ponytail: one fixed USD→MNT rate; read Mongolbank's daily rate here the day prices go live
  /** Prices are set in USD; tögrög is shown next to them at this rate. */
  MNT_PER_USD: parseFloat(process.env.MNT_PER_USD || '3500'),

  /** S3-compatible storage (DigitalOcean Spaces). Bucket, endpoint and both keys empty = /upload 404s. */
  SPACE_BUCKET_NAME: process.env.SPACE_BUCKET_NAME || '',
  SPACE_ENDPOINT: process.env.SPACE_ENDPOINT || '',
  SPACE_REGION: process.env.SPACE_REGION || 'us-east-1',
  SPACE_ACCESS_KEY: process.env.SPACE_ACCESS_KEY || '',
  SPACE_SECRET_KEY: process.env.SPACE_SECRET_KEY || '',
  /** CDN host in front of the bucket; empty falls back to the bucket URL. */
  SPACE_CDN_BASE: process.env.SPACE_CDN_BASE || '',
  /** Hard cap per uploaded image, enforced by multer and again before the PUT. */
  UPLOAD_MAX_MB: parseInt(process.env.UPLOAD_MAX_MB || '8'),

  /** First SUPER_ADMIN, created at boot when both are set and the phone is new. */
  SEED_ADMIN_NAME: process.env.SEED_ADMIN_NAME || 'Super Admin',
  SEED_ADMIN_PHONE: process.env.SEED_ADMIN_PHONE || '',
  SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD || '',
  /** Dev only: agencies, plans, travellers, past trips with reviews — seeded once into an empty database. */
  SEED_DEMO: process.env.SEED_DEMO === 'true',
  SEED_DEMO_PASSWORD: process.env.SEED_DEMO_PASSWORD || 'demo1234'
};
