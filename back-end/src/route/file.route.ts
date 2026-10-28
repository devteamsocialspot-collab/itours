import { Router } from 'express';
import multer from 'multer';
import config from '../config';
import { isSpaceEnabled } from '../config/digital-ocean-space';
import FileController from '../controllers/file/file.controller';
import UserController from '../controllers/user/user.controller';
import { pickLocale, t } from '../utils/i18n';

const { UPLOAD_MAX_MB } = config;

/**
 * The one REST surface the browser posts to: GraphQL stays JSON-only, so the plan editor sends photos
 * here, with the same bearer token. 404s while the bucket is unconfigured, so it is never half-open.
 */
const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: UPLOAD_MAX_MB * 1024 * 1024, files: 1 }
});

router.post('/upload', upload.single('file'), async (req, res) => {
  const lang = pickLocale(req.headers);
  if (!isSpaceEnabled)
    return res
      .status(404)
      .json({ success: false, message: t('error.uploadNotConfigured', lang) });
  try {
    const { userId, authError } = await UserController.verifyJwt(
      req.headers.authorization
    );
    if (!userId) throw new Error(authError);
    if (!req.file) throw new Error('error.uploadFailed');
    const url = await FileController.uploadImage(
      req.file.buffer,
      req.file.mimetype
    );
    res.json({ success: true, message: t('response.ok', lang), url });
  } catch (error) {
    res.status(400).json({ success: false, message: t(error.message, lang) });
  }
});

export default router;
