import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';

const router = Router();

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * POST /api/auth/login
 * Authenticates a user and creates a session.
 */
router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Populate session
    req.session.userId = user.id;
    req.session.userRole = user.role;
    req.session.userName = user.name;
    req.session.userEmail = user.email;

    return res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (err) {
    console.error('[auth/login]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/logout
 * Destroys the session and clears the cookie.
 */
router.post('/logout', requireAuth, (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.clearCookie('qahub.sid');
    return res.json({ message: 'Logged out successfully' });
  });
});

/**
 * GET /api/auth/me
 * Returns the currently authenticated user.
 */
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
    if (!user || !user.isActive) {
      req.session.destroy(() => {});
      return res.status(401).json({ error: 'Session invalid' });
    }
    return res.json(user);
  } catch {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
