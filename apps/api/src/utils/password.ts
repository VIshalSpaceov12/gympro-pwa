import bcrypt from 'bcryptjs';
import { AUTH } from '@gympro/shared';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, AUTH.BCRYPT_SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
