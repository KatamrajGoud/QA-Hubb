import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

/**
 * GET /api/activity
 * Returns paginated activity log entries.
 * Supports: projectId, entity, page, limit query params.
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const {
    projectId,
    entity,
    page = '1',
    limit = '30',
  } = req.query as Record<string, string>;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (projectId) where.projectId = projectId;
  if (entity) where.entity = entity;

  const [total, logs] = await Promise.all([
    prisma.activityLog.count({ where }),
    prisma.activityLog.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true } },
        project: { select: { id: true, name: true, code: true } },
      },
    }),
  ]);

  return res.json({ data: logs, total, page: parseInt(page), limit: parseInt(limit) });
});

export default router;
