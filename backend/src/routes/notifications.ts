import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

/**
 * GET /api/notifications
 * Returns the 50 most recent notifications for the current user.
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.session.userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return res.json(notifications);
});

/**
 * PATCH /api/notifications/read-all
 * Marks all unread notifications as read for the current user.
 * NOTE: must be defined BEFORE /:id/read to avoid route collision.
 */
router.patch('/read-all', requireAuth, async (req: Request, res: Response) => {
  await prisma.notification.updateMany({
    where: { userId: req.session.userId, isRead: false },
    data: { isRead: true },
  });
  return res.json({ message: 'All notifications marked as read' });
});

/**
 * PATCH /api/notifications/:id/read
 * Marks a single notification as read.
 */
router.patch('/:id/read', requireAuth, async (req: Request, res: Response) => {
  try {
    await prisma.notification.update({
      where: { id: req.params.id, userId: req.session.userId },
      data: { isRead: true },
    });
    return res.json({ message: 'Marked as read' });
  } catch {
    return res.status(404).json({ error: 'Notification not found' });
  }
});

export default router;
