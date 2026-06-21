import { Router } from 'express';
import * as permissionsController from './permissions.controller.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { requirePermission } from '../../middlewares/requirePermission.js';

const router = Router();

router.use(authenticate());

router.get(
  '/',
  asyncHandler(permissionsController.list),
);

router.get(
  '/users/:userId',
  requirePermission('MODERATOR_UPDATE'),
  asyncHandler(permissionsController.getUserPermissions),
);

router.post(
  '/users/:userId',
  requirePermission('MODERATOR_UPDATE'),
  asyncHandler(permissionsController.setUserPermissions),
);

export default router;
