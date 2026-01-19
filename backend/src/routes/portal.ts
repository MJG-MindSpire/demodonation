import { Router, type Request, type Response } from "express";
import { z } from "zod";

import { PortalCredential, PORTAL_KEYS } from "../models/PortalCredential.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { signAccessToken } from "../utils/jwt.js";

export const portalRouter = Router();

function toSafeCredential(doc: any) {
  return {
    id: doc._id.toString(),
    portalKey: doc.portalKey,
    username: doc.username,
    isActive: doc.isActive,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

const portalLoginSchema = z.object({
  portalKey: z.enum(PORTAL_KEYS),
  username: z.string().min(1),
  password: z.string().min(1),
});

portalRouter.post("/login", async (req: Request, res: Response) => {
  const input = portalLoginSchema.parse(req.body);

  // Temporary hardcoded admin credentials for testing
  if (input.portalKey === "admin" && input.username === "admin" && input.password === "admin123") {
    const token = signAccessToken({ sub: "temp-admin-id", role: input.portalKey });
    return res.json({
      token,
      user: { role: input.portalKey, username: input.username },
    });
  }

  const cred = await PortalCredential.findOne({ portalKey: input.portalKey, username: input.username })
    .select("+passwordHash")
    .exec();

  if (!cred) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }

  if (!cred.isActive) {
    res.status(403).json({ message: "Account disabled" });
    return;
  }

  const ok = await cred.verifyPassword(input.password);
  if (!ok) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }

  const token = signAccessToken({ sub: cred._id.toString(), role: input.portalKey });
  res.json({
    token,
    user: { role: input.portalKey, username: cred.username },
  });
});

const createCredentialSchema = z.object({
  portalKey: z.enum(PORTAL_KEYS),
  username: z.string().min(1),
  password: z.string().min(6),
  isActive: z.boolean().optional().default(true),
});

portalRouter.get("/admin/credentials", requireAuth, requireRole(["admin"]), async (_req: Request, res: Response) => {
  const creds = await PortalCredential.find({}).sort({ createdAt: -1 }).lean().exec();
  res.json({ credentials: creds.map((c) => ({
    id: c._id.toString(),
    portalKey: c.portalKey,
    username: c.username,
    isActive: c.isActive,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  })) });
});

portalRouter.post("/admin/credentials", requireAuth, requireRole(["admin"]), async (req: Request, res: Response) => {
  const input = createCredentialSchema.parse(req.body);

  const passwordHash = await PortalCredential.hashPassword(input.password);

  const created = await PortalCredential.create({
    portalKey: input.portalKey,
    username: input.username,
    passwordHash,
    isActive: input.isActive,
  });

  res.status(201).json({ credential: toSafeCredential(created) });
});

const updateCredentialSchema = z.object({
  username: z.string().min(1).optional(),
  password: z.string().min(6).optional(),
  isActive: z.boolean().optional(),
});

portalRouter.put(
  "/admin/credentials/:id",
  requireAuth,
  requireRole(["admin"]),
  async (req: Request, res: Response) => {
    const input = updateCredentialSchema.parse(req.body);

    const cred = await PortalCredential.findById(req.params.id).select("+passwordHash").exec();
    if (!cred) {
      res.status(404).json({ message: "Not found" });
      return;
    }

    if (input.username !== undefined) cred.username = input.username;
    if (input.isActive !== undefined) cred.isActive = input.isActive;
    if (input.password !== undefined) {
      cred.passwordHash = await PortalCredential.hashPassword(input.password);
    }

    await cred.save();
    res.json({ credential: toSafeCredential(cred) });
  },
);

portalRouter.delete(
  "/admin/credentials/:id",
  requireAuth,
  requireRole(["admin"]),
  async (req: Request, res: Response) => {
    const cred = await PortalCredential.findById(req.params.id).exec();
    if (!cred) {
      res.status(404).json({ message: "Not found" });
      return;
    }

    await cred.deleteOne();
    res.json({ ok: true });
  },
);
