/**
 * Automated Migration Script: SQLite Backup -> Supabase PostgreSQL
 *
 * Requirements addressed:
 * 1. Reads from independent SQLite Prisma client (dev.db.backup).
 * 2. Writes to Supabase using main PostgreSQL Prisma client.
 * 3. Migrates in strict foreign-key dependency order.
 * 4. Preserves exact IDs, timestamps, enums, and relationships.
 * 5. Uses idempotent upsert to handle duplicates safely without data loss.
 * 6. Validates source vs destination record counts.
 */
import 'dotenv/config';
import { PrismaClient as SqliteClient } from '../../prisma/generated/sqlite-client';
import { PrismaClient as PgClient } from '@prisma/client';

async function verifySupabaseConnection(pg: PgClient): Promise<boolean> {
  try {
    await pg.$queryRaw`SELECT 1`;
    return true;
  } catch (err: any) {
    console.error('❌ Failed to connect to Supabase PostgreSQL:');
    console.error('   ', err.message || err);
    return false;
  }
}

async function migrate() {
  console.log('🚀 Starting SQLite -> Supabase PostgreSQL migration...\n');

  const sqlite = new SqliteClient();
  const pg = new PgClient();

  try {
    // 0. Verify Supabase connection first
    console.log('🔌 Step 0: Testing Supabase connection...');
    const isConnected = await verifySupabaseConnection(pg);
    if (!isConnected) {
      throw new Error(
        'Cannot proceed with migration: Supabase connection failed. Check DATABASE_URL and DIRECT_URL in backend/.env.'
      );
    }
    console.log('   ✅ Supabase PostgreSQL is reachable.\n');

    // 1. Users
    console.log('👤 Step 1: Migrating Users...');
    const users = await sqlite.user.findMany();
    for (const u of users) {
      await pg.user.upsert({
        where: { id: u.id },
        update: {},
        create: {
          id: u.id,
          email: u.email,
          name: u.name,
          passwordHash: u.passwordHash,
          role: u.role,
          isActive: u.isActive,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
        },
      });
    }
    console.log(`   ✓ ${users.length} users processed.`);

    // 2. Projects
    console.log('📁 Step 2: Migrating Projects...');
    const projects = await sqlite.project.findMany();
    for (const p of projects) {
      await pg.project.upsert({
        where: { id: p.id },
        update: {},
        create: {
          id: p.id,
          code: p.code,
          name: p.name,
          description: p.description,
          status: p.status,
          priority: p.priority,
          techStack: p.techStack,
          startDate: p.startDate,
          targetDate: p.targetDate,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          ownerId: p.ownerId,
        },
      });
    }
    console.log(`   ✓ ${projects.length} projects processed.`);

    // 3. Project Members
    console.log('👥 Step 3: Migrating Project Members...');
    const members = await sqlite.projectMember.findMany();
    for (const m of members) {
      await pg.projectMember.upsert({
        where: { projectId_userId: { projectId: m.projectId, userId: m.userId } },
        update: {},
        create: {
          id: m.id,
          role: m.role,
          projectId: m.projectId,
          userId: m.userId,
        },
      });
    }
    console.log(`   ✓ ${members.length} project members processed.`);

    // 4. Resources
    console.log('📚 Step 4: Migrating Resources...');
    const resources = await sqlite.resource.findMany();
    for (const r of resources) {
      await pg.resource.upsert({
        where: { id: r.id },
        update: {},
        create: {
          id: r.id,
          title: r.title,
          category: r.category,
          url: r.url,
          description: r.description,
          addedById: r.addedById,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          projectId: r.projectId,
        },
      });
    }
    console.log(`   ✓ ${resources.length} resources processed.`);

    // 5. Builds
    console.log('📦 Step 5: Migrating Builds...');
    const builds = await sqlite.build.findMany();
    for (const b of builds) {
      await pg.build.upsert({
        where: { id: b.id },
        update: {},
        create: {
          id: b.id,
          version: b.version,
          platform: b.platform,
          releaseDate: b.releaseDate,
          buildUrl: b.buildUrl,
          releaseNotes: b.releaseNotes,
          qaStatus: b.qaStatus,
          testingNotes: b.testingNotes,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
          projectId: b.projectId,
          uploadedById: b.uploadedById,
        },
      });
    }
    console.log(`   ✓ ${builds.length} builds processed.`);

    // 6. Bugs
    console.log('🐛 Step 6: Migrating Bugs...');
    const bugs = await sqlite.bug.findMany();
    for (const bug of bugs) {
      await pg.bug.upsert({
        where: { id: bug.id },
        update: {},
        create: {
          id: bug.id,
          bugId: bug.bugId,
          title: bug.title,
          description: bug.description,
          module: bug.module,
          stepsToRepro: bug.stepsToRepro,
          expected: bug.expected,
          actual: bug.actual,
          severity: bug.severity,
          priority: bug.priority,
          status: bug.status,
          evidenceUrl: bug.evidenceUrl,
          retestNotes: bug.retestNotes,
          createdAt: bug.createdAt,
          updatedAt: bug.updatedAt,
          projectId: bug.projectId,
          buildId: bug.buildId,
          fixedBuildId: bug.fixedBuildId,
          reporterId: bug.reporterId,
          assigneeId: bug.assigneeId,
        },
      });
    }
    console.log(`   ✓ ${bugs.length} bugs processed.`);

    // 7. Bug Comments
    console.log('💬 Step 7: Migrating Bug Comments...');
    const comments = await sqlite.bugComment.findMany();
    for (const c of comments) {
      await pg.bugComment.upsert({
        where: { id: c.id },
        update: {},
        create: {
          id: c.id,
          body: c.body,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          bugId: c.bugId,
          userId: c.userId,
        },
      });
    }
    console.log(`   ✓ ${comments.length} bug comments processed.`);

    // 8. Daily Updates
    console.log('📝 Step 8: Migrating Daily Updates...');
    const dailyUpdates = await sqlite.dailyUpdate.findMany();
    for (const d of dailyUpdates) {
      await pg.dailyUpdate.upsert({
        where: { id: d.id },
        update: {},
        create: {
          id: d.id,
          workDone: d.workDone,
          currentTask: d.currentTask,
          blockers: d.blockers,
          nextSteps: d.nextSteps,
          timeSpent: d.timeSpent,
          date: d.date,
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
          projectId: d.projectId,
          userId: d.userId,
        },
      });
    }
    console.log(`   ✓ ${dailyUpdates.length} daily updates processed.`);

    // 9. Notifications
    console.log('🔔 Step 9: Migrating Notifications...');
    const notifications = await sqlite.notification.findMany();
    for (const n of notifications) {
      await pg.notification.upsert({
        where: { id: n.id },
        update: {},
        create: {
          id: n.id,
          type: n.type,
          message: n.message,
          link: n.link,
          isRead: n.isRead,
          createdAt: n.createdAt,
          userId: n.userId,
        },
      });
    }
    console.log(`   ✓ ${notifications.length} notifications processed.`);

    // 10. Activity Logs
    console.log('📜 Step 10: Migrating Activity Logs...');
    const logs = await sqlite.activityLog.findMany();
    for (const l of logs) {
      await pg.activityLog.upsert({
        where: { id: l.id },
        update: {},
        create: {
          id: l.id,
          entity: l.entity,
          entityId: l.entityId,
          action: l.action,
          details: l.details,
          createdAt: l.createdAt,
          userId: l.userId,
          projectId: l.projectId,
        },
      });
    }
    console.log(`   ✓ ${logs.length} activity logs processed.\n`);

    // 11. Validation Phase
    console.log('🔍 Step 11: Validating record counts...');
    const [pgUsers, pgProjects, pgMembers, pgResources, pgBuilds, pgBugs, pgComments, pgUpdates, pgNotifs, pgLogs] =
      await Promise.all([
        pg.user.count(),
        pg.project.count(),
        pg.projectMember.count(),
        pg.resource.count(),
        pg.build.count(),
        pg.bug.count(),
        pg.bugComment.count(),
        pg.dailyUpdate.count(),
        pg.notification.count(),
        pg.activityLog.count(),
      ]);

    const report = [
      { model: 'User', sqlite: users.length, supabase: pgUsers },
      { model: 'Project', sqlite: projects.length, supabase: pgProjects },
      { model: 'ProjectMember', sqlite: members.length, supabase: pgMembers },
      { model: 'Resource', sqlite: resources.length, supabase: pgResources },
      { model: 'Build', sqlite: builds.length, supabase: pgBuilds },
      { model: 'Bug', sqlite: bugs.length, supabase: pgBugs },
      { model: 'BugComment', sqlite: comments.length, supabase: pgComments },
      { model: 'DailyUpdate', sqlite: dailyUpdates.length, supabase: pgUpdates },
      { model: 'Notification', sqlite: notifications.length, supabase: pgNotifs },
      { model: 'ActivityLog', sqlite: logs.length, supabase: pgLogs },
    ];

    console.table(report);

    const allMatch = report.every((r) => r.sqlite === r.supabase);
    if (allMatch) {
      console.log('🎉 Migration successful! All record counts match 100%.');
    } else {
      console.warn('⚠️ Some record counts differ. Review the table above.');
    }
  } finally {
    await sqlite.$disconnect();
    await pg.$disconnect();
  }
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
