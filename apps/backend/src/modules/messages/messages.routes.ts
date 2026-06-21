import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { requirePermission } from '../../middlewares/requirePermission.js';
import { validate } from '../../middlewares/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import * as messagesController from './messages.controller.js';
import { sendMessageSchema, broadcastMessageSchema } from './messages.validator.js';

const router = Router();

router.use(authenticate());

router.post('/send', requirePermission('MESSAGE_SEND'), validate(sendMessageSchema), asyncHandler(messagesController.send));
router.post('/broadcast', requirePermission('MESSAGE_BROADCAST'), validate(broadcastMessageSchema), asyncHandler(messagesController.broadcast));
router.get('/campaigns', requirePermission('MESSAGE_HISTORY_VIEW'), asyncHandler(messagesController.getCampaigns));
router.get('/campaigns/:id', requirePermission('MESSAGE_HISTORY_VIEW'), asyncHandler(messagesController.getCampaignById));
router.get('/campaigns/:id/recipients', requirePermission('MESSAGE_HISTORY_VIEW'), asyncHandler(messagesController.getCampaignRecipients));

export default router;
