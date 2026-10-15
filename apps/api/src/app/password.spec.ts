import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password';

describe('password hashing', () => {
  it('verifies a correct password', async () => {
    const stored = await hashPassword('correct horse battery');

    expect(await verifyPassword('correct horse battery', stored)).toBe(true);
  });

  it('rejects a wrong password', async () => {
    const stored = await hashPassword('correct horse battery');

    expect(await verifyPassword('wrong password', stored)).toBe(false);
  });

  it('salts hashes so the same password hashes differently each time', async () => {
    const first = await hashPassword('same-password');
    const second = await hashPassword('same-password');

    expect(first).not.toBe(second);
    expect(await verifyPassword('same-password', first)).toBe(true);
    expect(await verifyPassword('same-password', second)).toBe(true);
  });

  it('returns false for a missing stored value', async () => {
    expect(await verifyPassword('x', null)).toBe(false);
    expect(await verifyPassword('x', undefined)).toBe(false);
    expect(await verifyPassword('x', '')).toBe(false);
  });

  it('returns false for a malformed stored value', async () => {
    expect(await verifyPassword('x', 'not-a-valid-hash')).toBe(false);
  });
});
