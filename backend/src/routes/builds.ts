import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { logActivity } from '../middleware/activity';
import { createNotificationsForBuild } from '../services/notifications';

// mergeParams: true allows access to :projectId from the parent router
const router = Router({ mergeParams: true });

const buildSchema = z.object({
  version: z.string().min(1).max(50),
  platform: z.enum(['WEB', 'ANDROID', 'IOS', 'API']),
  releaseDate: z.string().datetime().optional(),
  buildUrl: z.string().url('Must be a valid URL').optional().default(''),
  releaseNotes: z.string().max(5000).optional().default(''),
  qaStatus: z
    .enum(['PENDING', 'IN_TESTING', 'PASSED', 'FAILED', 'RETEST_REQUIRED'])
    .optional()
    .default('PENDING'),
  testingNotes: z.string().max(5000).optional().default(''),
});

/**
 * GET /api/projects/:projectId/builds
 * Returns all builds for a project, newest first.
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const builds = await prisma.build.findMany({
    where: { projectId: req.params.projectId },
    include: {
      uploadedBy: { select: { id: true, name: true } },
      _count: { select: { bugs: true } },
    },
    orderBy: { releaseDate: 'desc' },
  });
  return res.json(builds);
});

/**
 * GET /api/projects/:projectId/builds/:id
 * Returns a single build with associated bugs.
 */
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  const build = await prisma.build.findFirst({
    where: { id: req.params.id, projectId: req.params.projectId },
    include: {
      uploadedBy: { select: { id: true, name: true } },
      bugs: {
        select: {
          id: true,
          bugId: true,
          title: true,
          severity: true,
          status: true,
        },
      },
    },
  });
  if (!build) return res.status(404).json({ error: 'Build not found' });
  return res.json(build);
});

/**
 * POST /api/projects/:projectId/builds
 * Uploads a new build and notifies project members.
 */
router.post('/', requireAuth, validate(buildSchema), async (req: Request, res: Response) => {
  const build = await prisma.build.create({
    data: {
      ...req.body,
      releaseDate: req.body.releaseDate ? new Date(req.body.releaseDate) : new Date(),
      projectId: req.params.projectId,
      uploadedById: req.session.userId,
    },
  });

  await logActivity(
    'BUILD',
    build.id,
    'CREATED',
    JSON.stringify({ version: build.version }),
    req.session.userId,
    req.params.projectId
  );
  await createNotificationsForBuild(build.id, req.params.projectId, build.version);

  return res.status(201).json(build);
});

/**
 * PATCH /api/projects/:projectId/builds/:id
 * Updates build details or QA status.
 */
router.patch('/:id', requireAuth, validate(buildSchema.partial()), async (req: Request, res: Response) => {
  try {
    const build = await prisma.build.update({
      where: { id: req.params.id },
      data: req.body,
    });
    await logActivity(
      'BUILD',
      build.id,
      'UPDATED',
      JSON.stringify(req.body),
      req.session.userId,
      req.params.projectId
    );
    return res.json(build);
  } catch {
    return res.status(404).json({ error: 'Build not found' });
  }
});

/**
 * DELETE /api/projects/:projectId/builds/:id
 * Deletes a build.
 */
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const existing = await prisma.build.findFirst({
      where: { id: req.params.id, projectId: req.params.projectId },
    });
    if (!existing) return res.status(404).json({ error: 'Build not found' });

    await prisma.build.delete({ where: { id: req.params.id } });
    await logActivity(
      'BUILD',
      req.params.id,
      'DELETED',
      JSON.stringify({ version: existing.version }),
      req.session.userId,
      req.params.projectId
    );
    return res.json({ message: 'Build deleted' });
  } catch {
    return res.status(404).json({ error: 'Build not found' });
  }
});

export default router;
