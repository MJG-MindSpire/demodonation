import { Router, type Request, type Response } from "express";
import { z } from "zod";

import { Project, PROJECT_CATEGORIES, URGENCY_LEVELS } from "../models/Project.js";
import { requireAuth, requireRole, requireUser } from "../middleware/auth.js";
import { createUploader, toPublicUploadPath } from "../utils/uploads.js";

export const projectsRouter = Router();

const upload = createUploader("receiver-verifications");

function parseBooleanInput(value: unknown) {
  if (value === true) return true;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    return v === "true" || v === "1" || v === "yes";
  }
  if (typeof value === "number") return value === 1;
  return false;
}

const createProjectSchema = z.object({
  fullName: z.string().min(1),
  fatherOrOrgName: z.string().min(1),
  cnicOrIdNumber: z.string().optional().default(""),
  phone: z.string().min(1),
  alternatePhone: z.string().optional().default(""),
  city: z.string().min(1),
  fullAddress: z.string().min(1),

  title: z.string().min(1),
  purpose: z.string().min(1),
  requiredAmount: z.coerce.number().positive(),
  category: z.enum(PROJECT_CATEGORIES),
  urgencyLevel: z.enum(URGENCY_LEVELS).optional().default("medium"),
  description: z.string().min(1),
  usageBreakdown: z.string().min(1),
  durationText: z.string().optional().default(""),
  timelineStart: z.coerce.date().optional(),
  timelineEnd: z.coerce.date().optional(),
  enableBank: z.preprocess(parseBooleanInput, z.boolean()).optional().default(false),
  bankName: z.string().optional().default(""),
  bankAccountHolderName: z.string().optional().default(""),
  bankAccountNumber: z.string().optional().default(""),
  bankIban: z.string().optional().default(""),

  enableJazzcash: z.preprocess(parseBooleanInput, z.boolean()).optional().default(false),
  jazzcashAccountName: z.string().optional().default(""),
  jazzcashMobileNumber: z.string().optional().default(""),

  enableEasypaisa: z.preprocess(parseBooleanInput, z.boolean()).optional().default(false),
  easypaisaAccountName: z.string().optional().default(""),
  easypaisaMobileNumber: z.string().optional().default(""),
  steps: z
    .array(
      z.object({
        key: z.string().min(1),
        title: z.string().min(1),
        order: z.number().int().min(1),
      }),
    )
    .optional(),
});

projectsRouter.post(
  "/",
  requireAuth,
  requireRole(["receiver"]),
  requireUser,
  upload.array("verificationFiles", 12),
  async (req: Request, res: Response) => {
    if ((req.user?.registrationStatus ?? "").toLowerCase() !== "verified") {
      res.status(403).json({ message: "Account pending admin verification" });
      return;
    }

    const input = createProjectSchema.parse(req.body);

    const enableBank = Boolean(input.enableBank);
    const enableJazzcash = Boolean(input.enableJazzcash);
    const enableEasypaisa = Boolean(input.enableEasypaisa);

    if (!enableBank && !enableJazzcash && !enableEasypaisa) {
      res.status(400).json({ message: "Select and fill at least one payment method" });
      return;
    }

    if (enableBank) {
      if (!input.bankName.trim() || !input.bankAccountHolderName.trim() || !input.bankAccountNumber.trim()) {
        res.status(400).json({ message: "Bank details are incomplete" });
        return;
      }
    }

    if (enableJazzcash) {
      if (!input.jazzcashAccountName.trim() || !input.jazzcashMobileNumber.trim()) {
        res.status(400).json({ message: "JazzCash details are incomplete" });
        return;
      }
    }

    if (enableEasypaisa) {
      if (!input.easypaisaAccountName.trim() || !input.easypaisaMobileNumber.trim()) {
        res.status(400).json({ message: "EasyPaisa details are incomplete" });
        return;
      }
    }

    const files = Array.isArray(req.files) ? (req.files as Express.Multer.File[]) : [];
    if (!files || files.length === 0) {
      res.status(400).json({ message: "Verification images are required" });
      return;
    }

    const verificationMediaPaths = files.map((f) => toPublicUploadPath("receiver-verifications", f.filename));

    const steps =
      input.steps && input.steps.length > 0
        ? input.steps
        : [
            { key: "step-1", title: "Step 1", order: 1 },
            { key: "step-2", title: "Step 2", order: 2 },
            { key: "step-3", title: "Step 3", order: 3 },
          ];

    const created = await Project.create({
      receiverId: req.user!.id,
      receiverDetails: {
        fullName: input.fullName,
        fatherOrOrgName: input.fatherOrOrgName,
        cnicOrIdNumber: input.cnicOrIdNumber || undefined,
        phone: input.phone,
        alternatePhone: input.alternatePhone || undefined,
        city: input.city,
        fullAddress: input.fullAddress,
      },
      title: input.title,
      purpose: input.purpose,
      requiredAmount: input.requiredAmount,
      category: input.category,
      urgencyLevel: input.urgencyLevel,
      description: input.description,
      usageBreakdown: input.usageBreakdown,
      durationText: input.durationText || undefined,
      timelineStart: input.timelineStart,
      timelineEnd: input.timelineEnd,
      verificationMediaPaths,
      steps,
      paymentAccounts: {
        bank: enableBank
          ? {
              bankName: input.bankName.trim(),
              accountHolderName: input.bankAccountHolderName.trim(),
              accountNumber: input.bankAccountNumber.trim(),
              iban: input.bankIban.trim() || undefined,
            }
          : undefined,
        jazzcash: enableJazzcash
          ? {
              accountName: input.jazzcashAccountName.trim(),
              mobileNumber: input.jazzcashMobileNumber.trim(),
            }
          : undefined,
        easypaisa: enableEasypaisa
          ? {
              accountName: input.easypaisaAccountName.trim(),
              mobileNumber: input.easypaisaMobileNumber.trim(),
            }
          : undefined,
      },
      status: "pending",
    });

    res.status(201).json({ project: created.toObject() });
  },
);

projectsRouter.get("/mine", requireAuth, requireRole(["receiver"]), requireUser, async (req: Request, res: Response) => {
  const list = await Project.find({ receiverId: req.user!.id }).sort({ createdAt: -1 }).lean().exec();
  res.json({ projects: list });
});

projectsRouter.get("/:id", requireAuth, requireUser, async (req: Request, res: Response) => {
  const project = await Project.findById(req.params.id).lean().exec();
  if (!project) {
    res.status(404).json({ message: "Not found" });
    return;
  }

  if (req.user!.role !== "admin" && project.receiverId.toString() !== req.user!.id) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  res.json({ project });
});
