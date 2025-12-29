// src/modules/subscriptions/subscriptions.schema.ts
import { z } from 'zod';

export const createSubscriptionSchema = {
  body: z.object({
    newsletterName: z.string().min(1).max(200),
    senderEmail: z.string().email('Invalid email address')
  })
};

export const updateSubscriptionSchema = {
  params: z.object({
    id: z.string().uuid('Invalid subscription ID')
  }),
  body: z.object({
    isActive: z.boolean()
  })
};

export const deleteSubscriptionSchema = {
  params: z.object({
    id: z.string().uuid('Invalid subscription ID')
  })
};
