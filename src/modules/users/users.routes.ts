// src/modules/users/users.routes.ts
import { Router } from 'express';
import { handleRegisterUser, handleGetUserAlias } from './users.controller';
import { validateRequest } from '../../middleware/validation.middleware';
import { authLimiter, apiLimiter } from '../../middleware/rate-limiter';
import { asyncHandler } from '../../middleware/error-handler';
import { registerUserSchema, getUserAliasSchema } from './users.schema';

const router = Router();

router.post(
  '/register',
  authLimiter,
  validateRequest(registerUserSchema),
  asyncHandler(handleRegisterUser)
);

router.get(
  '/:userId/alias',
  apiLimiter,
  validateRequest(getUserAliasSchema),
  asyncHandler(handleGetUserAlias)
);

export default router;
