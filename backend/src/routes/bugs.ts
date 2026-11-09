import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { logActivity } from '../middleware/activity';
import { createNotificationForBug } from '../services/notifications';

const router = Router();

const bugSchema = z.object({
  projectId: z.string(),
  buildId: z.string().optional().nullable(),
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional().default(''),
  module: z.string().max(200).optional().default(''),
  stepsToRepro: z.string().max(5000).optional().default(''),
  expected: z.string().max(2000).optional().default(''),
  actual: z.string().max(2000).optional().default(''),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional().default('MEDIUM'),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional().default('MEDIUM'),
  status: z
    .enum(['NEW', 'ASSIGNED', 'IN_PROGRESS', 'FIXED', 'RETEST', 'REOPENED', 'CLOSED'])
    .optional()
    .default('NEW'),
  assigneeId: z.string().optional().nullable(),
  evidenceUrl: z
    .string()
    .url('Must be a valid URL')
    .optional()
    .or(z.literal(''))
    .default(''),
  retestNotes: z.string().max(2000).optional().default(''),
  fixedBuildId: z.string().optional().nullable(),
});

/**
 * Generates the next sequential bug ID in the format BUG-XXXX.
 * Uses total count + 1 to keep IDs monotonically increasing.
 */
async function generateBugId(): Promise<string> {
  const count = await prisma.bug.count();
  return `BUG-${String(count + 1).padStart(4, '0')}`;
}

/**
 * GET /api/bugs
 * Returns a paginated, filtered list of bugs.
 * Supports: projectId, status, severity, assigneeId, buildId, search, page, limit.
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const {
    projectId,
    status,
    severity,
    assigneeId,
    buildId,
    search,
    page = '1',
    limit = '20',
  } = req.query as Record<string, string>;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (projectId) where.projectId = projectId;
  if (status) where.status = status;
  if (severity) where.severity = severity;
  if (assigneeId) where.assigneeId = assigneeId;
  if (buildId) where.buildId = buildId;
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { bugId: { contains: search } },
      { description: { contains: search } },
    ];
  }

  const [total, bugs] = await Promise.all([
    prisma.bug.count({ where }),
    prisma.bug.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        project: { select: { id: true, name: true, code: true } },
        assignee: { select: { id: true, name: true } },
        reporter: { select: { id: true, name: true } },
        build: { select: { id: true, version: true } },
        _count: { select: { comments: true } },
      },
    }),
  ]);

  return res.json({ data: bugs, total, page: parseInt(page), limit: parseInt(limit) });
});

/**
 * GET /api/bugs/:id
 * Returns a single bug with comments, reporter, assignee, and build info.
 */
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  const bug = await prisma.bug.findUnique({
    where: { id: req.params.id },
    include: {
      project: { select: { id: true, name: true, code: true } },
      assignee: { select: { id: true, name: true } },
      reporter: { select: { id: true, name: true } },
      build: { select: { id: true, version: true } },
      fixedBuild: { select: { id: true, version: true } },
      comments: {
        include: { user: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!bug) return res.status(404).json({ error: 'Bug not found' });
  return res.json(bug);
});

/**
 * POST /api/bugs
 * Creates a new bug report. Only QA/ADMIN/HEAD can close bugs immediately.
 */
router.post('/', requireAuth, validate(bugSchema), async (req: Request, res: Response) => {
  // Enforce: only QA/ADMIN/HEAD can create a bug already in CLOSED state
  if (
    req.body.status === 'CLOSED' &&
    !['QA', 'ADMIN', 'HEAD'].includes(req.session.userRole!)
  ) {
    return res.status(403).json({ error: 'Only QA engineers can close bugs' });
  }

  const bugId = await generateBugId();
  const bug = await prisma.bug.create({
    data: { ...req.body, bugId, reporterId: req.session.userId },
    include: {
      project: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true } },
    },
  });

  await logActivity(
    'BUG',
    bug.id,
    'CREATED',
    JSON.stringify({ bugId, title: bug.title }),
    req.session.userId,
    bug.projectId
  );

  // Notify assignee if one was set at creation time
  if (bug.assigneeId) {
    await createNotificationForBug(bug.id, bug.assigneeId, 'BUG_ASSIGNED', bug.bugId, bug.title);
  }

  return res.status(201).json(bug);
});

/**
 * PATCH /api/bugs/:id
 * Updates bug fields. Triggers notifications on status changes.
 */
router.patch('/:id', requireAuth, validate(bugSchema.partial()), async (req: Request, res: Response) => {
  const existing = await prisma.bug.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: 'Bug not found' });

  // Enforce: only QA/ADMIN/HEAD can close a bug
  if (
    req.body.status === 'CLOSED' &&
    !['QA', 'ADMIN', 'HEAD'].includes(req.session.userRole!)
  ) {
    return res.status(403).json({ error: 'Only QA engineers can close bugs' });
  }

  const bug = await prisma.bug.update({
    where: { id: req.params.id },
    data: req.body,
  });

  await logActivity(
    'BUG',
    bug.id,
    'UPDATED',
    JSON.stringify(req.body),
    req.session.userId,
    bug.projectId
  );

  // Send relevant notifications on status transitions
  if (req.body.status && req.body.status !== existing.status) {
    if (req.body.status === 'FIXED' && existing.reporterId) {
      await createNotificationForBug(bug.id, existing.reporterId, 'BUG_FIXED', bug.bugId, bug.title);
    }
    if (req.body.status === 'RETEST' && existing.reporterId) {
      await createNotificationForBug(bug.id, existing.reporterId, 'RETEST_REQUIRED', bug.bugId, bug.title);
    }
    // Notify new assignee when bug is assigned
    if (req.body.assigneeId && req.body.assigneeId !== existing.assigneeId) {
      await createNotificationForBug(bug.id, req.body.assigneeId, 'BUG_ASSIGNED', bug.bugId, bug.title);
    }
  }

  return res.json(bug);
});

/**
 * POST /api/bugs/:id/comments
 * Adds a comment to a bug.
 */
router.post('/:id/comments', requireAuth, async (req: Request, res: Response) => {
  const { body } = req.body;
  if (!body || typeof body !== 'string' || body.trim().length === 0) {
    return res.status(400).json({ error: 'Comment body is required' });
  }

  const comment = await prisma.bugComment.create({
    data: {
      bugId: req.params.id,
      userId: req.session.userId!,
      body: body.trim(),
    },
    include: { user: { select: { id: true, name: true, role: true } } },
  });

  await logActivity(
    'BUG',
    req.params.id,
    'COMMENT_ADDED',
    JSON.stringify({ body: body.trim() }),
    req.session.userId
  );

  return res.status(201).json(comment);
});

/**
 * DELETE /api/bugs/:id
 * Deletes a bug. QA, ADMIN, or HEAD only.
 */
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const existing = await prisma.bug.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: 'Bug not found' });

  if (!['QA', 'ADMIN', 'HEAD'].includes(req.session.userRole!)) {
    return res.status(403).json({ error: 'Only QA, Admins, or Heads can delete bugs' });
  }

  await prisma.bug.delete({ where: { id: req.params.id } });
  await logActivity(
    'BUG',
    req.params.id,
    'DELETED',
    JSON.stringify({ bugId: existing.bugId, title: existing.title }),
    req.session.userId,
    existing.projectId
  );

  return res.json({ message: 'Bug deleted' });
});

export default router;
