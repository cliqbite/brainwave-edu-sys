import { Router } from 'express';
import * as usersController from './users.controller.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { validate } from '../../middlewares/validate.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { requirePermission } from '../../middlewares/requirePermission.js';
import {
  createUserSchema,
  updateUserSchema,
  resetPasswordSchema,
} from './users.validator.js';

const router = Router();

// All routes require authentication
router.use(authenticate());

router.get(
  '/',
  requirePermission('USER_VIEW'),
  asyncHandler(usersController.list),
);

router.get(
  '/:id',
  requirePermission('USER_VIEW'),
  asyncHandler(usersController.getById),
);

router.post(
  '/',
  requirePermission('USER_CREATE'),
  validate(createUserSchema),
  asyncHandler(usersController.create),
);

router.put(
  '/:id',
  requirePermission('USER_UPDATE'),
  validate(updateUserSchema),
  asyncHandler(usersController.update),
);

router.delete(
  '/:id',
  requirePermission('USER_DELETE'),
  asyncHandler(usersController.remove),
);

router.post(
  '/:id/reset-password',
  requirePermission('USER_UPDATE'),
  validate(resetPasswordSchema),
  asyncHandler(usersController.resetPassword),
);

export default router;
