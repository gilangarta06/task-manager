import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET;

if (!SECRET) {
  throw new Error("JWT_SECRET environment variable is required. Set it in .env");
}

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: "OWNER" | "MEMBER";
}

export function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export function signSession(payload: SessionPayload) {
  return jwt.sign(payload, SECRET as string, { expiresIn: "30d" });
}

export function verifySession(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, SECRET as string) as SessionPayload;
  } catch {
    return null;
  }
}
