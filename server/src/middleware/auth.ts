import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import prisma from '../db';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export function generateToken(payload: { id: string; email: string; role: string }): string {
  const options: SignOptions = { expiresIn: '7d' };
  return jwt.sign(payload, JWT_SECRET, options);
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Authentication required', code: 'NO_TOKEN' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) {
      res.status(401).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
      return;
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token', code: 'INVALID_TOKEN' });
  }
}

export function optionalAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; name: string; role: string };
      req.user = decoded;
    } catch {}
  }

  next();
}
