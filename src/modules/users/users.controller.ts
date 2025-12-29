// src/modules/users/users.controller.ts
import { Request, Response } from 'express';
import { registerUser, getUserEmailAlias } from './users.service';

export async function handleRegisterUser(req: Request, res: Response) {
  const { userId } = req.body;
  const result = await registerUser(userId);
  res.status(201).json(result);
}

export async function handleGetUserAlias(req: Request, res: Response) {
  const { userId } = req.params;
  const result = await getUserEmailAlias(userId);
  res.status(200).json(result);
}
