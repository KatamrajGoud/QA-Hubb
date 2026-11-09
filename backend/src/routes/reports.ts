import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireAdminOrHead } from '../middleware/auth';

const router = Router();

/**
 * GET /api/reports/summary
 * Returns a high-level summary of all non-archived projects
 * including bug counts by status and latest build QA status.
 * ADMIN and HEAD only.
 */
router.get('/summary', requireAdminOrHead, async (req: Request, res: Response) => {
  const projects = await prisma.project.findMany({
    where: { status: { not: 'ARCHIVED' } },
    include: {
      _count: { select: { bugs: true, builds: true } },
      bugs: { select: { status: true, severity: true } },
      builds: {
        select: { qaStatus: true },
        orderBy: { releaseDate: 'desc' },
        take: 1,
      },
    },
  });

  const summary = projects.map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    status: p.status,
    priority: p.priority,
    targetDate: p.targetDate,
    totalBugs: p._count.bugs,
    totalBuilds: p._count.builds,
    openBugs: p.bugs.filter((b) => b.status !== 'CLOSED').length,
    criticalBugs: p.bugs.filter((b) => b.severity === 'CRITICAL' && b.status !== 'CLOSED').length,
    latestBuildStatus: p.builds[0]?.qaStatus ?? null,
  }));

  return res.json(summary);
});

/**
 * GET /api/reports/bug-stats
 * Returns bug counts grouped by status, severity, and assignee.
 * Optionally filter by projectId. ADMIN and HEAD only.
 */
router.get('/bug-stats', requireAdminOrHead, async (req: Request, res: Response) => {
  const { projectId } = req.query as Record<string, string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = projectId ? { projectId } : {};

  const [byStatus, bySeverity, byAssignee] = await Promise.all([
    prisma.bug.groupBy({ by: ['status'], where, _count: { _all: true } }),
    prisma.bug.groupBy({ by: ['severity'], where, _count: { _all: true } }),
    prisma.bug.groupBy({
      by: ['assigneeId'],
      where: { ...where, assigneeId: { not: null } },
      _count: { _all: true },
    }),
  ]);

  return res.json({ byStatus, bySeverity, byAssignee });
});

export default router;
