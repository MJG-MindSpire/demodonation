import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "../models/User.js";
import { User } from "../models/User.js";
import { verifyAccessToken } from "../utils/jwt.js";

function getBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = getBearerToken(req);
  if (!token) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.auth = { userId: payload.sub, role: payload.role };
    next();
  } catch {
    res.status(401).json({ message: "Unauthorized" });
  }
}

export function requireRole(roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.auth?.role;
    if (!role) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    if (!roles.includes(role)) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
    next();
  };
}

export async function requireUser(req: Request, res: Response, next: NextFunction) {
  const userId = req.auth?.userId;
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const user = await User.findById(userId).lean().exec();
  if (!user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  req.user = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    name: user.name ?? undefined,
    isActive: user.isActive,
    registrationStatus: (user as any).registrationStatus,
  };
  next();
}
