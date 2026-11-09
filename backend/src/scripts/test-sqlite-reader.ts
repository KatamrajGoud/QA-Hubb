import { PrismaClient as SqliteClient } from '../../prisma/generated/sqlite-client';

async function main() {
  const sqlite = new SqliteClient();
  try {
    const counts = {
      users: await sqlite.user.count(),
      projects: await sqlite.project.count(),
      members: await sqlite.projectMember.count(),
      resources: await sqlite.resource.count(),
      builds: await sqlite.build.count(),
      bugs: await sqlite.bug.count(),
      comments: await sqlite.bugComment.count(),
      dailyUpdates: await sqlite.dailyUpdate.count(),
      notifications: await sqlite.notification.count(),
      activityLogs: await sqlite.activityLog.count(),
    };
    console.log('✅ Independent SQLite Reader succeeded:');
    console.log(JSON.stringify(counts, null, 2));
  } finally {
    await sqlite.$disconnect();
  }
}

main().catch((err) => {
  console.error('❌ SQLite Reader failed:', err);
  process.exit(1);
});
