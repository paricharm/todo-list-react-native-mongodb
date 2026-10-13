
import jwt from "jsonwebtoken";

export function generateToken(userId: string): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is missing from .env");
  }

  const expiresIn =
    (process.env.JWT_EXPIRES_IN || "1d") as jwt.SignOptions["expiresIn"];

  return jwt.sign({ userId }, secret, { expiresIn });
}