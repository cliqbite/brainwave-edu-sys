import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { requirePermission } from '../../middlewares/requirePermission.js';
import { validate } from '../../middlewares/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { uploadFile } from '../../middlewares/fileUpload.js';
import * as importsController from './imports.controller.js';
import { importUsersSchema } from './imports.validator.js';

const router = Router();

router.use(authenticate());

router.post(
  '/users',
  requirePermission('USER_IMPORT'),
  uploadFile,
  validate(importUsersSchema),
  asyncHandler(importsController.importUsers)
);

router.get('/history', requirePermission('USER_IMPORT'), asyncHandler(importsController.getHistory));
router.get('/:id', requirePermission('USER_IMPORT'), asyncHandler(importsController.getBatchDetails));

export default router;
