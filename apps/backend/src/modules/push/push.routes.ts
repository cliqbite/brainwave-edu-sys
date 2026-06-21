import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { requirePermission } from '../../middlewares/requirePermission.js';
import { validate } from '../../middlewares/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import * as pushController from './push.controller.js';
import { subscribeSchema, unsubscribeSchema, sendPushSchema } from './push.validator.js';

const router = Router();

router.use(authenticate());

router.post('/subscribe', validate(subscribeSchema), asyncHandler(pushController.subscribe));
router.post('/unsubscribe', validate(unsubscribeSchema), asyncHandler(pushController.unsubscribe));
router.post('/send', requirePermission('PUSH_NOTIFICATION_SEND'), validate(sendPushSchema), asyncHandler(pushController.send));
router.get('/subscriptions', asyncHandler(pushController.getSubscriptions));
router.get('/notifications', asyncHandler(pushController.getNotifications));
router.put('/notifications/read-all', asyncHandler(pushController.markAllAsReadInApp));
router.put('/notifications/:id/read-in-app', asyncHandler(pushController.markAsReadInApp));
router.put('/notifications/:id/read-push', asyncHandler(pushController.markAsReadPush));
export default router;
