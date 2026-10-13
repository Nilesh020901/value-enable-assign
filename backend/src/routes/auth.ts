import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { registerUser, loginUser, getUserById } from '../services/authService.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { env } from '../config/env.js';

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(2, 'Name must have at least 2 characters'),
  email: z.string().email('Please provide a valid email address'),
  mobile: z.string().regex(/^[0-9+()-\s]{10,15}$/, 'Please provide a valid mobile number'),
  dob: z.string().min(1, 'Date of Birth is required'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

const loginSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

function setAuthCookie(res: Response, token: string): void {
  res.cookie('jwt', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
}

// POST /api/auth/register
authRouter.post(
  '/register',
  authLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        const errors = parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        res.status(400).json({ message: 'Validation failed', errors });
        return;
      }

      const { user, token } = await registerUser(parsed.data);
      setAuthCookie(res, token);

      res.status(201).json({
        message: 'Account registered successfully',
        user,
      });
    } catch (err: any) {
      if (err.message && err.message.includes('already exists')) {
        res.status(409).json({ message: err.message });
        return;
      }
      next(err);
    }
  }
);

// POST /api/auth/login
authRouter.post(
  '/login',
  authLimiter,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        const errors = parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        res.status(400).json({ message: 'Validation failed', errors });
        return;
      }

      const { user, token } = await loginUser(parsed.data.email, parsed.data.password);
      setAuthCookie(res, token);

      res.status(200).json({
        message: 'Logged in successfully',
        user,
      });
    } catch (err: any) {
      if (err.message === 'Invalid email or password.') {
        res.status(401).json({ message: err.message });
        return;
      }
      next(err);
    }
  }
);

// POST /api/auth/logout
authRouter.post('/logout', (req: Request, res: Response): void => {
  res.clearCookie('jwt', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });
  res.status(200).json({ message: 'Logged out successfully' });
});

// GET /api/auth/me
authRouter.get(
  '/me',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await getUserById(req.user!.userId);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      res.status(200).json({ user });
    } catch (err) {
      next(err);
    }
  }
);
