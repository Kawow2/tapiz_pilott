import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

// Hash a password with scrypt (no native dependency needed). The stored value
// is `salt:derivedKey`, both hex-encoded.
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;

  return `${salt}:${derivedKey.toString('hex')}`;
}

// Verify a password against a stored `salt:derivedKey` value in constant time.
export async function verifyPassword(
  password: string,
  stored: string | null | undefined,
): Promise<boolean> {
  if (!stored) {
    return false;
  }

  const [salt, key] = stored.split(':');

  if (!salt || !key) {
    return false;
  }

  const keyBuffer = Uint8Array.from(Buffer.from(key, 'hex'));
  const derivedKey = Uint8Array.from(
    (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer,
  );

  return (
    keyBuffer.length === derivedKey.length &&
    timingSafeEqual(keyBuffer, derivedKey)
  );
}
