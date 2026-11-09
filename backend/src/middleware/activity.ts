import { prisma } from '../lib/prisma';

/**
 * Utility function to record an activity log entry.
 * Errors are swallowed — activity logging must never break the main operation.
 */
export async function logActivity(
  entity: string,
  entityId: string,
  action: string,
  details: string,
  userId: string | undefined,
  projectId?: string
): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        entity,
        entityId,
        action,
        details,
        userId: userId || null,
        projectId: projectId || null,
      },
    });
  } catch {
    // Activity logging should not break the main operation
  }
}
