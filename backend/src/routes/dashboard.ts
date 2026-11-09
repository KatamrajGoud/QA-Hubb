import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

/**
 * GET /api/dashboard
 * Returns aggregated stats for the dashboard overview:
 * - Project counts by status
 * - Bug counts by severity / open status
 * - Builds awaiting QA
 * - Recent activity feed
 * - Recent builds
 * - Blocked / on-hold projects
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const [
    totalProjects,
    activeProjects,
    inTestingProjects,
    completedProjects,
    totalBugs,
    openBugs,
    criticalBugs,
    highBugs,
    mediumBugs,
    lowBugs,
    buildsAwaitingTesting,
    recentActivity,
    recentBuilds,
    blockedProjects,
  ] = await Promise.all([
    prisma.project.count({ where: { status: { not: 'ARCHIVED' } } }),
    prisma.project.count({ where: { status: 'ACTIVE' } }),
    prisma.project.count({ where: { status: 'IN_TESTING' } }),
    prisma.project.count({ where: { status: 'COMPLETED' } }),
    prisma.bug.count(),
    prisma.bug.count({ where: { status: { not: 'CLOSED' } } }),
    prisma.bug.count({ where: { severity: 'CRITICAL', status: { not: 'CLOSED' } } }),
    prisma.bug.count({ where: { severity: 'HIGH', status: { not: 'CLOSED' } } }),
    prisma.bug.count({ where: { severity: 'MEDIUM', status: { not: 'CLOSED' } } }),
    prisma.bug.count({ where: { severity: 'LOW', status: { not: 'CLOSED' } } }),
    prisma.build.count({ where: { qaStatus: 'PENDING' } }),
    prisma.activityLog.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true } },
        project: { select: { id: true, name: true, code: true } },
      },
    }),
    prisma.build.findMany({
      take: 5,
      orderBy: { releaseDate: 'desc' },
      include: {
        project: { select: { id: true, name: true, code: true } },
        uploadedBy: { select: { id: true, name: true } },
      },
    }),
    prisma.project.findMany({
      where: { status: 'ON_HOLD' },
      take: 5,
      include: { owner: { select: { id: true, name: true } } },
    }),
  ]);

  return res.json({
    projects: {
      total: totalProjects,
      active: activeProjects,
      inTesting: inTestingProjects,
      completed: completedProjects,
    },
    bugs: {
      total: totalBugs,
      open: openBugs,
      critical: criticalBugs,
      high: highBugs,
      medium: mediumBugs,
      low: lowBugs,
    },
    builds: { awaitingTesting: buildsAwaitingTesting },
    blockedProjects,
    recentActivity,
    recentBuilds,
  });
});

export default router;
