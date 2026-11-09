import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { validate } from '../middleware/validate';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['ADMIN', 'HEAD', 'QA', 'DEVELOPER']),
});

const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  role: z.enum(['ADMIN', 'HEAD', 'QA', 'DEVELOPER']).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).optional(),
});

/**
 * GET /api/users
 * Returns all users (id, email, name, role, isActive, createdAt).
 * Any authenticated user may call this to populate assignee dropdowns, etc.
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { name: 'asc' },
  });
  return res.json(users);
});

/**
 * POST /api/users
 * Creates a new user. ADMIN only.
 */
router.post('/', requireRole('ADMIN'), validate(createUserSchema), async (req: Request, res: Response) => {
  const { email, name, password, role } = req.body;

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email: email.toLowerCase(), name, passwordHash, role },
    select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
  });
  return res.status(201).json(user);
});

/**
 * PATCH /api/users/:id
 * Updates a user's profile, role, or password. ADMIN only.
 */
router.patch('/:id', requireRole('ADMIN'), validate(updateUserSchema), async (req: Request, res: Response) => {
  const { id } = req.params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = { ...req.body };

  if (data.password) {
    data.passwordHash = await bcrypt.hash(data.password, 12);
    delete data.password;
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });
    return res.json(user);
  } catch {
    return res.status(404).json({ error: 'User not found' });
  }
});

export default router;
