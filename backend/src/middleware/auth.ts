import { Request, Response, NextFunction } from 'express';
import basicAuth from 'express-basic-auth';
import bcrypt from 'bcryptjs';
import { getDb } from '../models/database';

const db = getDb();

// Custom authorizer function
const authorizer = (username: string, password: string, cb: (err: Error | null, authorized?: boolean) => void) => {
  try {
    const user = db.prepare('SELECT password_hash FROM users WHERE username = ?').get(username) as { password_hash: string } | undefined;
    
    if (!user) {
      return cb(null, false);
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    cb(null, isValid);
  } catch (error) {
    cb(error as Error, false);
  }
};

export const authMiddleware = basicAuth({
  authorizer,
  authorizeAsync: true,
  challenge: true,
  realm: 'TODO Application',
});

// Middleware to attach user info to request
export const attachUserInfo = (req: Request, res: Response, next: NextFunction) => {
  // express-basic-auth sets req.auth.user
  const username = (req as any).auth?.user;
  if (username) {
    const user = db.prepare('SELECT id, username FROM users WHERE username = ?').get(username) as { id: number; username: string } | undefined;
    if (user) {
      (req as any).userId = user.id;
      (req as any).username = user.username;
    }
  }
  next();
};

