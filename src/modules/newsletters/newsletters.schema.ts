// src/modules/newsletters/newsletters.schema.ts
import { z } from 'zod';

export const fetchNewslettersSchema = {
  query: z.object({
    cursor: z.string().uuid().optional(),
    limit: z.coerce.number().min(1).max(100).default(30),
    status: z.enum(['all', 'unread', 'read', 'archived']).default('all')
  })
};

export const getNewsletterSchema = {
  params: z.object({
    id: z.string().uuid('Invalid newsletter ID')
  })
};

export const updateNewsletterSchema = {
  params: z.object({
    id: z.string().uuid('Invalid newsletter ID')
  }),
  body: z.object({
    isRead: z.boolean().optional(),
    isArchived: z.boolean().optional()
  }).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided'
  })
};

export const deleteNewsletterSchema = {
  params: z.object({
    id: z.string().uuid('Invalid newsletter ID')
  })
};
