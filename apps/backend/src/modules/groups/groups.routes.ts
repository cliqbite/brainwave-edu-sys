import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.js';
import { requirePermission } from '../../middlewares/requirePermission.js';
import { validate } from '../../middlewares/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import * as groupsController from './groups.controller.js';
import { createGroupSchema, updateGroupSchema, addUsersSchema } from './groups.validator.js';

const router = Router();

router.use(authenticate());

router.get('/', requirePermission('GROUP_VIEW'), asyncHandler(groupsController.listGroups));
router.post('/', requirePermission('GROUP_CREATE'), validate(createGroupSchema), asyncHandler(groupsController.createGroup));
router.get('/:id', requirePermission('GROUP_VIEW'), asyncHandler(groupsController.getGroupById));
router.put('/:id', requirePermission('GROUP_UPDATE'), validate(updateGroupSchema), asyncHandler(groupsController.updateGroup));
router.delete('/:id', requirePermission('GROUP_DELETE'), asyncHandler(groupsController.deleteGroup));
router.post('/:id/users', requirePermission('GROUP_UPDATE'), validate(addUsersSchema), asyncHandler(groupsController.addUsersToGroup));
router.delete('/:id/users/:userId', requirePermission('GROUP_UPDATE'), asyncHandler(groupsController.removeUserFromGroup));

export default router;
