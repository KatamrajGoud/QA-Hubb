import { describe, it, expect } from 'vitest';
import bcrypt from 'bcrypt';

describe('Password hashing security', () => {
  it('should hash a password and verify it correctly', async () => {
    const password = 'SecurePassword123!';
    const hash = await bcrypt.hash(password, 10);
    expect(hash).not.toBe(password);
    const valid = await bcrypt.compare(password, hash);
    expect(valid).toBe(true);
  });

  it('should reject an incorrect password', async () => {
    const hash = await bcrypt.hash('correct-password', 10);
    const valid = await bcrypt.compare('wrong-password', hash);
    expect(valid).toBe(false);
  });
});
