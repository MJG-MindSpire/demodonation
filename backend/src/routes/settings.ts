import fs from "fs";
import path from "path";
import { Router, type Request, type Response } from "express";
import multer from "multer";
import { z } from "zod";

import { AppSettings } from "../models/AppSettings.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const settingsRouter = Router();

const defaultSettings = {
  name: "DonateFlow",
  address: "",
  phone: "",
  logoPath: "",
};

settingsRouter.get("/", async (_req: Request, res: Response) => {
  const settings = await AppSettings.findOne({}).sort({ createdAt: -1 }).lean().exec();
  res.json({ settings: settings ?? defaultSettings });
});

const updateSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional().default(""),
  phone: z.string().optional().default(""),
});

settingsRouter.put("/", requireAuth, requireRole(["admin"]), async (req: Request, res: Response) => {
  const input = updateSchema.parse(req.body);

  const existing = await AppSettings.findOne({}).sort({ createdAt: -1 }).exec();
  const logoPath = existing?.logoPath;

  if (existing) {
    existing.name = input.name;
    existing.address = input.address;
    existing.phone = input.phone;
    if (logoPath) existing.logoPath = logoPath;
    await existing.save();
    res.json({ settings: existing.toObject() });
    return;
  }

  const created = await AppSettings.create({ ...input });
  res.status(201).json({ settings: created.toObject() });
});

settingsRouter.delete("/", requireAuth, requireRole(["admin"]), async (_req: Request, res: Response) => {
  await AppSettings.deleteMany({}).exec();
  res.json({ ok: true });
});

const uploadsDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}_${safe}`);
  },
});

const upload = multer({ storage });

settingsRouter.post(
  "/logo",
  requireAuth,
  requireRole(["admin"]),
  upload.single("logo"),
  async (req: Request, res: Response) => {
    const file = req.file;
    if (!file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    const logoPath = `/uploads/${file.filename}`;

    const existing = await AppSettings.findOne({}).sort({ createdAt: -1 }).exec();
    if (existing) {
      existing.logoPath = logoPath;
      await existing.save();
      res.json({ settings: existing.toObject() });
      return;
    }

    const created = await AppSettings.create({ ...defaultSettings, logoPath });
    res.status(201).json({ settings: created.toObject() });
  },
);
