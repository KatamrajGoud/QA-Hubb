import { prisma } from '../lib/prisma';

/**
 * Creates a BUILD_RELEASED notification for every member of a project
 * when a new build is uploaded. Errors are swallowed.
 */
export async function createNotificationsForBuild(
  buildId: string,
  projectId: string,
  version: string
): Promise<void> {
  try {
    const members = await prisma.projectMember.findMany({
      where: { projectId },
      select: { userId: true },
    });
    if (members.length === 0) return;
    await prisma.notification.createMany({
      data: members.map((m) => ({
        userId: m.userId,
        type: 'BUILD_RELEASED',
        message: `New build ${version} has been released`,
        link: `/projects/${projectId}/builds/${buildId}`,
      })),
    });
  } catch {
    // Non-critical — don't surface notification errors to caller
  }
}

/**
 * Creates a single notification for a bug-related event.
 * type: 'BUG_ASSIGNED' | 'BUG_FIXED' | 'RETEST_REQUIRED'
 */
export async function createNotificationForBug(
  bugId: string,
  userId: string,
  type: string,
  bugRefId: string,
  title: string
): Promise<void> {
  try {
    const messages: Record<string, string> = {
      BUG_ASSIGNED: `Bug ${bugRefId} has been assigned to you: ${title}`,
      BUG_FIXED: `Bug ${bugRefId} has been marked as fixed: ${title}`,
      RETEST_REQUIRED: `Bug ${bugRefId} requires retesting: ${title}`,
    };
    await prisma.notification.create({
      data: {
        userId,
        type,
        message: messages[type] || `Bug ${bugRefId} updated`,
        link: `/bugs/${bugId}`,
      },
    });
  } catch {
    // Non-critical
  }
}
