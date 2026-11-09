import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';

const router = Router();

const dailyUpdateSchema = z.object({
  projectId: z.string().optional().nullable(),
  workDone: z.string().max(3000).optional().default(''),
  currentTask: z.string().max(1000).optional().default(''),
  blockers: z.string().max(1000).optional().default(''),
  nextSteps: z.string().max(1000).optional().default(''),
  timeSpent: z.number().min(0).max(24).optional().nullable(),
  date: z.string().datetime().optional(),
});

/**
 * GET /api/daily-updates
 * Returns paginated daily updates. Non-admin/head users only see their own.
 * Supports: projectId, userId, page, limit query params.
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const {
    projectId,
    userId,
    page = '1',
    limit = '20',
  } = req.query as Record<string, string>;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (projectId) where.projectId = projectId;

  // Admins and heads may filter by any userId; others only see their own
  if (['ADMIN', 'HEAD'].includes(req.session.userRole!)) {
    if (userId) where.userId = userId;
  } else {
    where.userId = req.session.userId;
  }

  const [total, updates] = await Promise.all([
    prisma.dailyUpdate.count({ where }),
    prisma.dailyUpdate.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { date: 'desc' },
      include: {
        user: { select: { id: true, name: true, role: true } },
        project: { select: { id: true, name: true, code: true } },
      },
    }),
  ]);

  return res.json({ data: updates, total, page: parseInt(page), limit: parseInt(limit) });
});

/**
 * POST /api/daily-updates
 * Creates a daily update for the current user.
 */
router.post('/', requireAuth, validate(dailyUpdateSchema), async (req: Request, res: Response) => {
  const update = await prisma.dailyUpdate.create({
    data: {
      ...req.body,
      date: req.body.date ? new Date(req.body.date) : new Date(),
      userId: req.session.userId!,
    },
    include: {
      user: { select: { id: true, name: true, role: true } },
      project: { select: { id: true, name: true, code: true } },
    },
  });
  return res.status(201).json(update);
});

/**
 * PATCH /api/daily-updates/:id
 * Updates a daily update. Users can only edit their own; ADMIN can edit any.
 */
router.patch('/:id', requireAuth, validate(dailyUpdateSchema.partial()), async (req: Request, res: Response) => {
  const existing = await prisma.dailyUpdate.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: 'Update not found' });

  if (existing.userId !== req.session.userId && req.session.userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'You can only edit your own updates' });
  }

  const update = await prisma.dailyUpdate.update({
    where: { id: req.params.id },
    data: req.body,
    include: {
      user: { select: { id: true, name: true, role: true } },
      project: { select: { id: true, name: true, code: true } },
    },
  });
  return res.json(update);
});

/**
 * DELETE /api/daily-updates/:id
 * Deletes a daily update. Users can only delete their own; ADMIN can delete any.
 */
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const existing = await prisma.dailyUpdate.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: 'Update not found' });

  if (existing.userId !== req.session.userId && req.session.userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'You can only delete your own updates' });
  }

  await prisma.dailyUpdate.delete({ where: { id: req.params.id } });
  return res.json({ message: 'Update deleted' });
});

export default router;
