// src/modules/newsletters/newsletters.routes.ts
import { Router } from 'express';
import { 
  handleFetchNewsletters, 
  handleGetNewsletter, 
  handleUpdateNewsletter, 
  handleDeleteNewsletter 
} from './newsletters.controller';
import { validateRequest } from '../../middleware/validation.middleware';
import { authenticateUser } from '../../middleware/auth.middleware';
import { apiLimiter } from '../../middleware/rate-limiter';
import { asyncHandler } from '../../middleware/error-handler';
import { 
  fetchNewslettersSchema, 
  getNewsletterSchema, 
  updateNewsletterSchema, 
  deleteNewsletterSchema 
} from './newsletters.schema';

const router = Router();

// All newsletter routes require authentication
router.use(authenticateUser);
router.use(apiLimiter);

router.get(
  '/',
  validateRequest(fetchNewslettersSchema),
  asyncHandler(handleFetchNewsletters)
);

router.get(
  '/:id',
  validateRequest(getNewsletterSchema),
  asyncHandler(handleGetNewsletter)
);

router.patch(
  '/:id',
  validateRequest(updateNewsletterSchema),
  asyncHandler(handleUpdateNewsletter)
);

router.delete(
  '/:id',
  validateRequest(deleteNewsletterSchema),
  asyncHandler(handleDeleteNewsletter)
);

export default router;
