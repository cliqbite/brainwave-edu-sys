import { Router } from 'express';
import * as rolesController from './roles.controller.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { authenticate } from '../../middlewares/authenticate.js';

const router = Router();

router.use(authenticate());

router.get('/', asyncHandler(rolesController.list));
router.get('/:id', asyncHandler(rolesController.getById));

export default router;
