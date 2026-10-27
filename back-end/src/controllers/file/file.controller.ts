import { createHash } from 'node:crypto';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import config from '../../config';
import { client, isSpaceEnabled } from '../../config/digital-ocean-space';

const { SPACE_BUCKET_NAME, SPACE_CDN_BASE, SPACE_ENDPOINT, UPLOAD_MAX_MB } =
  config;

const MB = 1024 * 1024;
/** The bucket is shared with other projects; everything itours uploads lives under this folder. */
const ROOT_FOLDER = 'itours';
const TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif'
};

/**
 * Plan photos and agency covers are uploaded from the partner screens, so they live in the bucket,
 * not on the API server's disk. No retries, no multipart — these are images; a failed upload is a
 * retry by the person who pressed the button.
 */
export default class FileController {
  static _checkFile(mimetype: string, size: number) {
    if (!isSpaceEnabled) throw new Error('error.uploadNotConfigured');
    if (!TYPES[mimetype]) throw new Error('error.fileType');
    if (size > UPLOAD_MAX_MB * MB) throw new Error('error.fileTooLarge');
  }

  /** itours/<folder>/<hash>.<ext>. Content-hashed, so re-uploading the same file is free. */
  static _objectKey(file: Buffer, mimetype: string, prefix: string) {
    // the prefix comes from the browser: one plain folder name, so a key can never leave ROOT_FOLDER
    const folder = /^[a-z0-9-]{1,32}$/.test(prefix) ? prefix : 'uploads';
    const hash = createHash('sha1').update(file).digest('hex').slice(0, 32);
    return `${ROOT_FOLDER}/${folder}/${hash}.${TYPES[mimetype]}`;
  }

  /** Returns the public URL. */
  static async uploadImage(file: Buffer, mimetype: string, prefix = 'uploads') {
    this._checkFile(mimetype, file.length);
    const key = this._objectKey(file, mimetype, prefix);

    await client.send(
      new PutObjectCommand({
        Bucket: SPACE_BUCKET_NAME,
        Key: key,
        Body: file,
        ContentType: mimetype,
        ACL: 'public-read',
        CacheControl: 'public, max-age=31536000, immutable'
      })
    );

    const base =
      SPACE_CDN_BASE ||
      SPACE_ENDPOINT.replace('https://', `https://${SPACE_BUCKET_NAME}.`);
    return `${base.replace(/\/$/, '')}/${key}`;
  }
}
