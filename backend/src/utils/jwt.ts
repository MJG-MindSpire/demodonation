import jwt, { type JwtPayload, type Secret, type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import type { UserRole } from "../models/User.js";

export type AccessTokenPayload = JwtPayload & {
  sub: string;
  role: UserRole;
};

export function signAccessToken(payload: AccessTokenPayload): string {
  const secret: Secret = env.JWT_SECRET;
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, secret, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const secret: Secret = env.JWT_SECRET;
  return jwt.verify(token, secret) as AccessTokenPayload;
}
