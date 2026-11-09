import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const urlRegex = /^https?:\/\/.+/;
const resourceSchema = z.object({
  title: z.string().min(1).max(200),
  category: z.enum(['URL', 'GOOGLE_SHEET', 'GOOGLE_DOC', 'GITHUB', 'API_DOC', 'APK', 'REQUIREMENT', 'TEST_PLAN', 'BUG_DOC', 'OTHER']),
  url: z.string().regex(urlRegex, 'Must be a valid URL starting with http:// or https://'),
});

const projectCodeSchema = z.string().min(2).max(20).regex(/^[A-Z0-9-]+$/, 'Project code must be alphanumeric with hyphens');

describe('Resource URL validation', () => {
  it('accepts valid https URLs', () => {
    const result = resourceSchema.safeParse({ title: 'Test Resource', category: 'URL', url: 'https://staging.company.local' });
    expect(result.success).toBe(true);
  });

  it('rejects URLs without http or https protocol', () => {
    const result = resourceSchema.safeParse({ title: 'Invalid Protocol', category: 'URL', url: 'ftp://ftp.company.local' });
    expect(result.success).toBe(false);
  });

  it('rejects empty or whitespace URLs', () => {
    const result = resourceSchema.safeParse({ title: 'Empty', category: 'URL', url: '' });
    expect(result.success).toBe(false);
  });
});

describe('Project code formatting', () => {
  it('validates correct uppercase project codes', () => {
    expect(projectCodeSchema.safeParse('SHOP-001').success).toBe(true);
    expect(projectCodeSchema.safeParse('QA-HUB').success).toBe(true);
  });

  it('rejects invalid project codes with lowercase or special chars', () => {
    expect(projectCodeSchema.safeParse('shop-001').success).toBe(false);
    expect(projectCodeSchema.safeParse('SHOP_001!').success).toBe(false);
  });
});
