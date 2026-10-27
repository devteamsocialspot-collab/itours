import { S3Client } from '@aws-sdk/client-s3';
import config from '.';

const {
  SPACE_ACCESS_KEY,
  SPACE_BUCKET_NAME,
  SPACE_ENDPOINT,
  SPACE_REGION,
  SPACE_SECRET_KEY
} = config;

/** Uploads are on only when the whole bucket is configured; otherwise /upload answers 404. */
export const isSpaceEnabled = Boolean(
  SPACE_BUCKET_NAME && SPACE_ENDPOINT && SPACE_ACCESS_KEY && SPACE_SECRET_KEY
);

export const client: S3Client = new S3Client({
  forcePathStyle: false,
  endpoint: SPACE_ENDPOINT || undefined,
  region: SPACE_REGION,
  credentials: {
    accessKeyId: SPACE_ACCESS_KEY,
    secretAccessKey: SPACE_SECRET_KEY
  }
});
