import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';

// mergeParams: true allows access to :projectId from the parent router
const router = Router({ mergeParams: true });

const resourceSchema = z.object({
  title: z.string().min(1).max(200),
  category: z.enum([
    'URL',
    'GOOGLE_SHEET',
    'GOOGLE_DOC',
    'GITHUB',
    'API_DOC',
    'APK',
    'REQUIREMENT',
    'TEST_PLAN',
    'BUG_DOC',
    'OTHER',
  ]),
  url: z
    .string()
    .regex(/^https?:\/\/.+/, 'Must be a valid URL starting with http:// or https://'),
  description: z.string().max(1000).optional().default(''),
});

/**
 * GET /api/projects/:projectId/resources
 * Returns all resources for a project.
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const resources = await prisma.resource.findMany({
    where: { projectId: req.params.projectId },
    orderBy: { createdAt: 'desc' },
  });
  return res.json(resources);
});

/**
 * POST /api/projects/:projectId/resources
 * Adds a resource to a project.
 */
router.post('/', requireAuth, validate(resourceSchema), async (req: Request, res: Response) => {
  const resource = await prisma.resource.create({
    data: {
      ...req.body,
      projectId: req.params.projectId,
      addedById: req.session.userId,
    },
  });
  return res.status(201).json(resource);
});

/**
 * PATCH /api/projects/:projectId/resources/:id
 * Updates a resource.
 */
router.patch('/:id', requireAuth, validate(resourceSchema.partial()), async (req: Request, res: Response) => {
  try {
    const resource = await prisma.resource.update({
      where: { id: req.params.id },
      data: req.body,
    });
    return res.json(resource);
  } catch {
    return res.status(404).json({ error: 'Resource not found' });
  }
});

/**
 * DELETE /api/projects/:projectId/resources/:id
 * Deletes a resource.
 */
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    await prisma.resource.delete({ where: { id: req.params.id } });
    return res.json({ message: 'Resource deleted' });
  } catch {
    return res.status(404).json({ error: 'Resource not found' });
  }
});

export default router;
