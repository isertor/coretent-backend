// src/modules/subscriptions/subscriptions.routes.ts
import { Router } from 'express';
import { 
  handleCreateSubscription, 
  handleFetchSubscriptions, 
  handleUpdateSubscription, 
  handleDeleteSubscription 
} from './subscriptions.controller';
import { validateRequest } from '../../middleware/validation.middleware';
import { authenticateUser } from '../../middleware/auth.middleware';
import { apiLimiter } from '../../middleware/rate-limiter';
import { asyncHandler } from '../../middleware/error-handler';
import { 
  createSubscriptionSchema, 
  updateSubscriptionSchema, 
  deleteSubscriptionSchema 
} from './subscriptions.schema';

const router = Router();

// All subscription routes require authentication
router.use(authenticateUser);
router.use(apiLimiter);

router.post(
  '/',
  validateRequest(createSubscriptionSchema),
  asyncHandler(handleCreateSubscription)
);

router.get(
  '/',
  asyncHandler(handleFetchSubscriptions)
);

router.patch(
  '/:id',
  validateRequest(updateSubscriptionSchema),
  asyncHandler(handleUpdateSubscription)
);

router.delete(
  '/:id',
  validateRequest(deleteSubscriptionSchema),
  asyncHandler(handleDeleteSubscription)
);

export default router;
