/**
 * Development-only seed script.
 * Creates sample users, projects, resources, builds, bugs, and daily updates.
 * Run with: pnpm run db:seed
 *
 * WARNING: DO NOT run in production — data is fictional and passwords are weak.
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱  Seeding development data...');

  // All seed users share this password: "Password123!"
  const DEV_HASH = await bcrypt.hash('Password123!', 12);

  // ─── Users ───────────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@qahubbdemo.local' },
    update: {},
    create: {
      email: 'admin@qahubbdemo.local',
      name: 'Alice Admin',
      passwordHash: DEV_HASH,
      role: 'ADMIN',
    },
  });

  const head = await prisma.user.upsert({
    where: { email: 'head@qahubbdemo.local' },
    update: {},
    create: {
      email: 'head@qahubbdemo.local',
      name: 'Bob Head',
      passwordHash: DEV_HASH,
      role: 'HEAD',
    },
  });

  const qa = await prisma.user.upsert({
    where: { email: 'qa@qahubbdemo.local' },
    update: {},
    create: {
      email: 'qa@qahubbdemo.local',
      name: 'Carol QA',
      passwordHash: DEV_HASH,
      role: 'QA',
    },
  });

  const dev = await prisma.user.upsert({
    where: { email: 'dev@qahubbdemo.local' },
    update: {},
    create: {
      email: 'dev@qahubbdemo.local',
      name: 'Dave Developer',
      passwordHash: DEV_HASH,
      role: 'DEVELOPER',
    },
  });

  console.log('  ✓ Users created');

  // ─── Projects ─────────────────────────────────────────────────────────────
  const projectAlpha = await prisma.project.upsert({
    where: { code: 'ALPHA' },
    update: {},
    create: {
      code: 'ALPHA',
      name: 'Project Alpha',
      description: 'Sample e-commerce platform under active development.',
      status: 'IN_TESTING',
      priority: 'HIGH',
      techStack: 'React, Node.js, PostgreSQL',
      startDate: new Date('2026-01-01'),
      targetDate: new Date('2026-12-31'),
      ownerId: head.id,
      members: {
        create: [
          { userId: qa.id, role: 'QA' },
          { userId: dev.id, role: 'DEVELOPER' },
        ],
      },
    },
  });

  const projectBeta = await prisma.project.upsert({
    where: { code: 'BETA' },
    update: {},
    create: {
      code: 'BETA',
      name: 'Project Beta',
      description: 'Internal HR dashboard — on hold pending stakeholder sign-off.',
      status: 'ON_HOLD',
      priority: 'MEDIUM',
      techStack: 'Vue.js, FastAPI, SQLite',
      ownerId: admin.id,
      members: {
        create: [{ userId: dev.id, role: 'DEVELOPER' }],
      },
    },
  });

  console.log('  ✓ Projects created');

  // ─── Resources ────────────────────────────────────────────────────────────
  await prisma.resource.createMany({
    data: [
      {
        projectId: projectAlpha.id,
        title: 'Alpha API Documentation',
        category: 'API_DOC',
        url: 'https://example.com/alpha/api-docs',
        description: 'OpenAPI spec for Project Alpha backend.',
        addedById: head.id,
      },
      {
        projectId: projectAlpha.id,
        title: 'Alpha GitHub Repository',
        category: 'GITHUB',
        url: 'https://github.com/example/project-alpha',
        addedById: dev.id,
      },
      {
        projectId: projectBeta.id,
        title: 'Beta Requirements Sheet',
        category: 'GOOGLE_SHEET',
        url: 'https://docs.google.com/spreadsheets/d/example',
        addedById: admin.id,
      },
    ],
  });

  console.log('  ✓ Resources created');

  // ─── Builds ───────────────────────────────────────────────────────────────
  const buildAlpha1 = await prisma.build.create({
    data: {
      projectId: projectAlpha.id,
      version: '1.0.0',
      platform: 'WEB',
      releaseDate: new Date('2026-09-01'),
      buildUrl: 'https://builds.example.com/alpha/1.0.0',
      releaseNotes: 'Initial release. Core auth and product listing implemented.',
      qaStatus: 'PASSED',
      testingNotes: 'All smoke tests passed. Minor UI issues logged.',
      uploadedById: dev.id,
    },
  });

  const buildAlpha2 = await prisma.build.create({
    data: {
      projectId: projectAlpha.id,
      version: '1.1.0',
      platform: 'WEB',
      releaseDate: new Date('2026-10-01'),
      buildUrl: 'https://builds.example.com/alpha/1.1.0',
      releaseNotes: 'Cart and checkout flow. Fixed login redirect bug.',
      qaStatus: 'IN_TESTING',
      uploadedById: dev.id,
    },
  });

  console.log('  ✓ Builds created');

  // ─── Bugs ─────────────────────────────────────────────────────────────────
  const bug1 = await prisma.bug.create({
    data: {
      bugId: 'BUG-0001',
      projectId: projectAlpha.id,
      buildId: buildAlpha1.id,
      title: 'Login redirect loop on Safari',
      description: 'After successful login on Safari 17, user is redirected back to login page.',
      module: 'Authentication',
      stepsToRepro: '1. Open Safari\n2. Navigate to /login\n3. Enter valid credentials\n4. Observe redirect',
      expected: 'User is redirected to dashboard',
      actual: 'User is redirected back to /login in a loop',
      severity: 'HIGH',
      priority: 'HIGH',
      status: 'FIXED',
      fixedBuildId: buildAlpha2.id,
      reporterId: qa.id,
      assigneeId: dev.id,
    },
  });

  const bug2 = await prisma.bug.create({
    data: {
      bugId: 'BUG-0002',
      projectId: projectAlpha.id,
      buildId: buildAlpha2.id,
      title: 'Cart total does not update on quantity change',
      description: 'Changing item quantity in the cart does not recalculate the total price.',
      module: 'Cart',
      stepsToRepro: '1. Add product to cart\n2. Change quantity to 3\n3. Observe total',
      expected: 'Total = unit price × 3',
      actual: 'Total remains at unit price × 1',
      severity: 'CRITICAL',
      priority: 'CRITICAL',
      status: 'IN_PROGRESS',
      reporterId: qa.id,
      assigneeId: dev.id,
    },
  });

  const bug3 = await prisma.bug.create({
    data: {
      bugId: 'BUG-0003',
      projectId: projectAlpha.id,
      buildId: buildAlpha2.id,
      title: 'Typo in checkout confirmation email',
      description: 'Email subject reads "Order Confimation" instead of "Order Confirmation".',
      module: 'Email',
      severity: 'LOW',
      priority: 'LOW',
      status: 'NEW',
      reporterId: qa.id,
    },
  });

  console.log('  ✓ Bugs created');

  // ─── Bug Comments ──────────────────────────────────────────────────────────
  await prisma.bugComment.createMany({
    data: [
      {
        bugId: bug1.id,
        userId: dev.id,
        body: 'Root cause: session cookie SameSite attribute not set correctly for Safari. Fixed in 1.1.0.',
      },
      {
        bugId: bug1.id,
        userId: qa.id,
        body: 'Confirmed fixed in build 1.1.0. Closing.',
      },
      {
        bugId: bug2.id,
        userId: dev.id,
        body: 'Investigating — looks like a React state mutation issue in CartContext.',
      },
    ],
  });

  console.log('  ✓ Bug comments created');

  // ─── Daily Updates ────────────────────────────────────────────────────────
  await prisma.dailyUpdate.createMany({
    data: [
      {
        userId: dev.id,
        projectId: projectAlpha.id,
        workDone: 'Fixed login redirect bug (BUG-0001). Wrote unit tests.',
        currentTask: 'Investigating cart total bug (BUG-0002)',
        blockers: 'None',
        nextSteps: 'Fix CartContext mutation, deploy to staging',
        timeSpent: 7.5,
        date: new Date('2026-10-20'),
      },
      {
        userId: qa.id,
        projectId: projectAlpha.id,
        workDone: 'Ran regression tests on build 1.1.0. Logged BUG-0002 and BUG-0003.',
        currentTask: 'Writing test cases for checkout flow',
        blockers: 'BUG-0002 blocks checkout test completion',
        nextSteps: 'Complete test plan for v1.2',
        timeSpent: 8,
        date: new Date('2026-10-20'),
      },
    ],
  });

  console.log('  ✓ Daily updates created');

  // ─── Activity Logs ────────────────────────────────────────────────────────
  await prisma.activityLog.createMany({
    data: [
      {
        entity: 'PROJECT',
        entityId: projectAlpha.id,
        action: 'CREATED',
        details: JSON.stringify({ name: projectAlpha.name }),
        userId: admin.id,
        projectId: projectAlpha.id,
      },
      {
        entity: 'BUILD',
        entityId: buildAlpha1.id,
        action: 'CREATED',
        details: JSON.stringify({ version: '1.0.0' }),
        userId: dev.id,
        projectId: projectAlpha.id,
      },
      {
        entity: 'BUG',
        entityId: bug1.id,
        action: 'STATUS_CHANGED',
        details: JSON.stringify({ status: 'FIXED' }),
        userId: dev.id,
        projectId: projectAlpha.id,
      },
    ],
  });

  console.log('  ✓ Activity logs created');

  // ─── Notifications ────────────────────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      {
        userId: qa.id,
        type: 'BUILD_RELEASED',
        message: 'New build 1.1.0 has been released',
        link: `/projects/${projectAlpha.id}/builds/${buildAlpha2.id}`,
      },
      {
        userId: dev.id,
        type: 'BUG_ASSIGNED',
        message: `Bug BUG-0002 has been assigned to you: ${bug2.title}`,
        link: `/bugs/${bug2.id}`,
      },
    ],
  });

  console.log('  ✓ Notifications created');

  console.log('\n✅  Seed complete!');
  console.log('\n   Demo credentials (password: Password123!):');
  console.log('   admin@qahubbdemo.local  → ADMIN');
  console.log('   head@qahubbdemo.local   → HEAD');
  console.log('   qa@qahubbdemo.local     → QA');
  console.log('   dev@qahubbdemo.local    → DEVELOPER\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
