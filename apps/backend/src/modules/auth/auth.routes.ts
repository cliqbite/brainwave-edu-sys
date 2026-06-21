import { Router } from 'express';
import * as authController from './auth.controller.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { validate } from '../../middlewares/validate.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { auditLog } from '../../middlewares/auditLogger.js';
import {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  changePasswordSchema,
} from './auth.validator.js';

const router = Router();

router.post(
  '/register',
  validate(registerSchema),
  asyncHandler(authController.register),
);

router.post(
  '/login',
  validate(loginSchema),
  asyncHandler(authController.login),
);

router.post(
  '/refresh-token',
  validate(refreshTokenSchema),
  asyncHandler(authController.refreshToken),
);

router.post(
  '/logout',
  authenticate(),
  asyncHandler(authController.logout),
);

router.get(
  '/me',
  authenticate(),
  asyncHandler(authController.me),
);

router.post(
  '/change-password',
  authenticate(),
  validate(changePasswordSchema),
  asyncHandler(authController.changePassword),
);

export default router;
