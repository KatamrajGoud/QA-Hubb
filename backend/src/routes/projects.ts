import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { validate } from '../middleware/validate';
import { requireAuth, requireAdminOrHead } from '../middleware/auth';
import { logActivity } from '../middleware/activity';

const router = Router();

const projectSchema = z.object({
  code: z.string().min(2).max(20).toUpperCase(),
  name: z.string().min(2).max(200),
  description: z.string().max(2000).optional().default(''),
  status: z.enum(['ACTIVE', 'IN_TESTING', 'COMPLETED', 'ARCHIVED', 'ON_HOLD']).optional().default('ACTIVE'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional().default('MEDIUM'),
  techStack: z.string().max(500).optional().default(''),
  startDate: z.string().datetime().optional().nullable(),
  targetDate: z.string().datetime().optional().nullable(),
  ownerId: z.string(),
  memberIds: z
    .array(z.object({ userId: z.string(), role: z.string() }))
    .optional()
    .default([]),
});

const projectUpdateSchema = projectSchema.partial();

/**
 * GET /api/projects
 * Returns paginated list of projects. Non-admin/head users only see projects
 * they own or are a member of.
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const {
    search,
    status,
    priority,
    page = '1',
    limit = '20',
  } = req.query as Record<string, string>;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (status) where.status = status;
  if (priority) where.priority = priority;

  // Non-admins / non-heads only see their own projects
  const role = req.session.userRole;
  const userId = req.session.userId;
  if (role !== 'ADMIN' && role !== 'HEAD') {
    const baseOr = where.OR || [];
    where.OR = [
      ...baseOr,
      { ownerId: userId },
      { members: { some: { userId } } },
    ];
  }

  const [total, projects] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { updatedAt: 'desc' },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
        },
        _count: { select: { bugs: true, builds: true } },
      },
    }),
  ]);

  return res.json({ data: projects, total, page: parseInt(page), limit: parseInt(limit) });
});

/**
 * GET /api/projects/:id
 * Returns a single project with owner, members, and counts.
 */
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      },
      _count: { select: { bugs: true, builds: true, resources: true } },
    },
  });
  if (!project) return res.status(404).json({ error: 'Project not found' });
  return res.json(project);
});

/**
 * POST /api/projects
 * Creates a new project. ADMIN or HEAD only.
 */
router.post('/', requireAdminOrHead, validate(projectSchema), async (req: Request, res: Response) => {
  const { memberIds, ...data } = req.body;
  try {
    const project = await prisma.project.create({
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : null,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        members: {
          create: (memberIds as { userId: string; role: string }[]).map((m) => ({
            userId: m.userId,
            role: m.role,
          })),
        },
      },
      include: { owner: { select: { id: true, name: true } } },
    });
    await logActivity(
      'PROJECT',
      project.id,
      'CREATED',
      JSON.stringify({ name: project.name }),
      req.session.userId,
      project.id
    );
    return res.status(201).json(project);
  } catch (err: unknown) {
    const prismaErr = err as { code?: string };
    if (prismaErr.code === 'P2002') {
      return res.status(409).json({ error: 'Project code already exists' });
    }
    console.error('[projects/POST]', err);
    return res.status(500).json({ error: 'Failed to create project' });
  }
});

/**
 * PATCH /api/projects/:id
 * Updates project fields. ADMIN or HEAD only.
 */
router.patch('/:id', requireAdminOrHead, validate(projectUpdateSchema), async (req: Request, res: Response) => {
  const { memberIds, ...data } = req.body;
  // memberIds is accepted but handled separately to avoid overwriting via patch here
  // Full member management should go through a dedicated members sub-route if needed
  try {
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
      },
    });
    await logActivity(
      'PROJECT',
      project.id,
      'UPDATED',
      JSON.stringify(data),
      req.session.userId,
      project.id
    );
    return res.json(project);
  } catch {
    return res.status(404).json({ error: 'Project not found' });
  }
});

/**
 * DELETE /api/projects/:id
 * Soft-deletes a project by archiving it. ADMIN or HEAD only.
 */
router.delete('/:id', requireAdminOrHead, async (req: Request, res: Response) => {
  try {
    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: { status: 'ARCHIVED' },
    });
    await logActivity(
      'PROJECT',
      project.id,
      'STATUS_CHANGED',
      JSON.stringify({ status: 'ARCHIVED' }),
      req.session.userId,
      project.id
    );
    return res.json({ message: 'Project archived' });
  } catch {
    return res.status(404).json({ error: 'Project not found' });
  }
});

/**
 * POST /api/projects/:id/members
 * Adds a member to a project. ADMIN, HEAD, or project owner only.
 */
router.post('/:id/members', requireAuth, async (req: Request, res: Response) => {
  const { id: projectId } = req.params;
  const { userId, role = 'DEVELOPER' } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const isOwner = project.ownerId === req.session.userId;
  const isAdminOrHead = ['ADMIN', 'HEAD'].includes(req.session.userRole!);
  if (!isOwner && !isAdminOrHead) {
    return res.status(403).json({ error: 'Only project owners, Admins, or Heads can manage members' });
  }

  try {
    const member = await prisma.projectMember.create({
      data: {
        projectId,
        userId,
        role,
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    await logActivity(
      'PROJECT',
      projectId,
      'UPDATED',
      JSON.stringify({ addedMember: member.user.name, role }),
      req.session.userId,
      projectId
    );

    return res.status(201).json(member);
  } catch (err: unknown) {
    const prismaErr = err as { code?: string };
    if (prismaErr.code === 'P2002') {
      return res.status(409).json({ error: 'User is already a member of this project' });
    }
    return res.status(500).json({ error: 'Failed to add member' });
  }
});

/**
 * DELETE /api/projects/:id/members/:memberId
 * Removes a member from a project.
 */
router.delete('/:id/members/:memberId', requireAuth, async (req: Request, res: Response) => {
  const { id: projectId, memberId } = req.params;

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const isOwner = project.ownerId === req.session.userId;
  const isAdminOrHead = ['ADMIN', 'HEAD'].includes(req.session.userRole!);
  if (!isOwner && !isAdminOrHead) {
    return res.status(403).json({ error: 'Only project owners, Admins, or Heads can manage members' });
  }

  try {
    await prisma.projectMember.delete({
      where: { id: memberId },
    });

    await logActivity(
      'PROJECT',
      projectId,
      'UPDATED',
      JSON.stringify({ removedMemberId: memberId }),
      req.session.userId,
      projectId
    );

    return res.json({ message: 'Member removed from project' });
  } catch {
    return res.status(404).json({ error: 'Member not found' });
  }
});

export default router;
