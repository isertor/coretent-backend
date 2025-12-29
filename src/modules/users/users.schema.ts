// src/modules/users/users.schema.ts
import { z } from 'zod';

export const registerUserSchema = {
  body: z.object({
    userId: z.string().uuid('Invalid UUID format for userId')
  })
};

export const getUserAliasSchema = {
  params: z.object({
    userId: z.string().uuid('Invalid UUID format for userId')
  })
};
