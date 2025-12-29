// src/modules/newsletters/newsletters.controller.ts
import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { fetchNewsletters, getNewsletter, updateNewsletter, deleteNewsletter } from './newsletters.service';

export async function handleFetchNewsletters(req: Request, res: Response) {
  const { userId } = (req as AuthRequest).user!;
  const { cursor, limit, status } = req.query as any;

  const result = await fetchNewsletters({
    userId,
    cursor,
    limit,
    status
  });

  res.status(200).json(result);
}

export async function handleGetNewsletter(req: Request, res: Response) {
  const { userId } = (req as AuthRequest).user!;
  const { id } = req.params;

  const result = await getNewsletter(id, userId);
  res.status(200).json(result);
}

export async function handleUpdateNewsletter(req: Request, res: Response) {
  const { userId } = (req as AuthRequest).user!;
  const { id } = req.params;
  const updates = req.body;

  const result = await updateNewsletter(id, userId, updates);
  res.status(200).json(result);
}

export async function handleDeleteNewsletter(req: Request, res: Response) {
  const { userId } = (req as AuthRequest).user!;
  const { id } = req.params;

  const result = await deleteNewsletter(id, userId);
  res.status(200).json(result);
}
