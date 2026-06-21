import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { authorize } from '../../middlewares/authorize.js';
import { requirePermission } from '../../middlewares/requirePermission.js';
import { asyncHandler } from '../../utils/async-handler.js';
import * as auditController from './audit.controller.js';

const router = Router();

router.use(authenticate());

// Only MASTER or users with explicit AUDIT_LOG_VIEW permission can view logs
router.get('/logs', authorize('MASTER'), requirePermission('AUDIT_LOG_VIEW'), asyncHandler(auditController.getLogs));

export default router;
