// src/modules/subscriptions/subscriptions.controller.ts
import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { 
  createSubscription, 
  fetchSubscriptions, 
  updateSubscription, 
  deleteSubscription 
} from './subscriptions.service';

export async function handleCreateSubscription(req: Request, res: Response) {
  const { userId } = (req as AuthRequest).user!;
  const { newsletterName, senderEmail } = req.body;

  const result = await createSubscription(userId, newsletterName, senderEmail);
  res.status(201).json(result);
}

export async function handleFetchSubscriptions(req: Request, res: Response) {
  const { userId } = (req as AuthRequest).user!;

  const result = await fetchSubscriptions(userId);
  res.status(200).json(result);
}

export async function handleUpdateSubscription(req: Request, res: Response) {
  const { userId } = (req as AuthRequest).user!;
  const { id } = req.params;
  const { isActive } = req.body;

  const result = await updateSubscription(id, userId, isActive);
  res.status(200).json(result);
}

export async function handleDeleteSubscription(req: Request, res: Response) {
  const { userId } = (req as AuthRequest).user!;
  const { id } = req.params;

  const result = await deleteSubscription(id, userId);
  res.status(200).json(result);
}
