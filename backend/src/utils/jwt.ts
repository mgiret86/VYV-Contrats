import jwt, { SignOptions } from 'jsonwebtoken';

export function signAccessToken(userId: string, role: string): string {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRATION || '15m') as any,
  };
  return jwt.sign({ userId, role }, process.env.JWT_SECRET!, options);
}

export function verifyAccessToken(token: string): { userId: string; role: string } {
  return jwt.verify(token, process.env.JWT_SECRET!) as { userId: string; role: string };
}
