import { describe, it, expect } from 'vitest';
import { z } from 'zod';

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

const dailyUpdateSchema = z.object({
  projectId: z.string().optional().nullable(),
  workDone: z.string().max(3000).optional().default(''),
  currentTask: z.string().max(1000).optional().default(''),
  blockers: z.string().max(1000).optional().default(''),
  nextSteps: z.string().max(1000).optional().default(''),
  timeSpent: z.number().min(0).max(24).optional().nullable(),
  date: z.string().datetime().optional(),
});

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['ADMIN', 'HEAD', 'QA', 'DEVELOPER']),
});

describe('Bug Schema Validation', () => {
  it('validates a valid bug payload', () => {
    const res = bugSchema.safeParse({
      projectId: 'proj_123',
      title: 'Crash on clicking submit',
      severity: 'CRITICAL',
      priority: 'HIGH',
      status: 'NEW',
    });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.severity).toBe('CRITICAL');
      expect(res.data.status).toBe('NEW');
    }
  });

  it('rejects an empty bug title', () => {
    const res = bugSchema.safeParse({
      projectId: 'proj_123',
      title: '',
    });
    expect(res.success).toBe(false);
  });

  it('rejects an invalid severity', () => {
    const res = bugSchema.safeParse({
      projectId: 'proj_123',
      title: 'Bug',
      severity: 'URGENT',
    });
    expect(res.success).toBe(false);
  });
});

describe('Build Schema Validation', () => {
  it('validates a valid build payload', () => {
    const res = buildSchema.safeParse({
      version: 'v2.0.0',
      platform: 'ANDROID',
      qaStatus: 'PENDING',
      buildUrl: 'https://storage.googleapis.com/apk/app.apk',
    });
    expect(res.success).toBe(true);
  });

  it('rejects an invalid platform', () => {
    const res = buildSchema.safeParse({
      version: 'v2.0.0',
      platform: 'MACOS',
    });
    expect(res.success).toBe(false);
  });
});

describe('Daily Update Schema Validation', () => {
  it('validates a daily standup update', () => {
    const res = dailyUpdateSchema.safeParse({
      workDone: 'Created the new UI components',
      currentTask: 'Connecting API',
      blockers: 'None',
      nextSteps: 'QA testing',
      timeSpent: 8,
    });
    expect(res.success).toBe(true);
  });

  it('rejects timeSpent greater than 24 hours', () => {
    const res = dailyUpdateSchema.safeParse({
      workDone: 'Worked all day and night',
      timeSpent: 28,
    });
    expect(res.success).toBe(false);
  });
});

describe('Create User Schema Validation', () => {
  it('validates a valid user with 8+ char password and role', () => {
    const res = createUserSchema.safeParse({
      email: 'engineer@qa.local',
      name: 'John Doe',
      password: 'StrongPassword123!',
      role: 'DEVELOPER',
    });
    expect(res.success).toBe(true);
  });

  it('rejects password shorter than 8 chars', () => {
    const res = createUserSchema.safeParse({
      email: 'engineer@qa.local',
      name: 'John Doe',
      password: 'short',
      role: 'DEVELOPER',
    });
    expect(res.success).toBe(false);
  });

  it('rejects invalid email address', () => {
    const res = createUserSchema.safeParse({
      email: 'not-an-email',
      name: 'John Doe',
      password: 'StrongPassword123!',
      role: 'DEVELOPER',
    });
    expect(res.success).toBe(false);
  });
});
