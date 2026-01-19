import { Router, type Request, type Response } from "express";
import { z } from "zod";

import { requireAuth, requireRole, requireUser } from "../middleware/auth.js";
import { Donation, DONATION_METHODS } from "../models/Donation.js";
import { Project } from "../models/Project.js";
import { createUploader, toPublicUploadPath } from "../utils/uploads.js";
import { capturePayPalOrder, createPayPalOrder } from "../utils/paypal.js";

export const donationsRouter = Router();

const upload = createUploader("donation-proofs");

// Donor-only endpoints

donationsRouter.use(requireAuth, requireRole(["donor"]), requireUser);

donationsRouter.get("/mine", async (req: Request, res: Response) => {
  const list = await Donation.find({ donorId: req.user!.id })
    .populate("projectId", "title status requiredAmount collectedAmount spentAmount progressPercent usageBreakdown")
    .sort({ createdAt: -1 })
    .lean()
    .exec();

  res.json({ donations: list });
});

const submitOfflineDonationSchema = z.object({
  method: z
    .string()
    .min(1)
    .transform((v) => v.trim().toLowerCase())
    .refine((v) => v !== "paypal", { message: "PayPal donations must be created via PayPal checkout" })
    .refine((v) => v === "bank" || v === "jazzcash" || v === "easypaisa", { message: "Unsupported payment method" }),
  paidAmount: z.coerce.number().positive(),
  transactionId: z.string().min(1).transform((v) => v.trim()),
  donorAccountName: z.string().min(1).transform((v) => v.trim()),
  donorAccountNumberOrMobile: z.string().min(1).transform((v) => v.trim()),
});

donationsRouter.post(
  "/projects/:projectId/submit-offline",
  upload.array("proof", 10),
  async (req: Request, res: Response) => {
    const input = submitOfflineDonationSchema.parse(req.body);

    const project = await Project.findById(req.params.projectId).lean().exec();
    if (!project || project.status !== "approved") {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    const method = input.method;
    const paymentAccounts = (project as any).paymentAccounts as
      | {
          bank?: { bankName?: string; accountHolderName?: string; accountNumber?: string; iban?: string };
          jazzcash?: { accountName?: string; mobileNumber?: string };
          easypaisa?: { accountName?: string; mobileNumber?: string };
        }
      | undefined;

    if (method === "bank") {
      const bank = paymentAccounts?.bank;
      if (!bank?.bankName || !bank?.accountHolderName || !bank?.accountNumber) {
        res.status(400).json({ message: "Bank transfer is not enabled for this project" });
        return;
      }
    }

    if (method === "jazzcash") {
      const jc = paymentAccounts?.jazzcash;
      if (!jc?.accountName || !jc?.mobileNumber) {
        res.status(400).json({ message: "JazzCash is not enabled for this project" });
        return;
      }
    }

    if (method === "easypaisa") {
      const ep = paymentAccounts?.easypaisa;
      if (!ep?.accountName || !ep?.mobileNumber) {
        res.status(400).json({ message: "EasyPaisa is not enabled for this project" });
        return;
      }
    }

    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      res.status(400).json({ message: "Payment proof is required" });
      return;
    }

    const proofPaths = files.map((f) => toPublicUploadPath("donation-proofs", f.filename));

    const receiptNo = Donation.makeReceiptNo();
    const created = await Donation.create({
      projectId: project._id,
      donorId: req.user!.id,
      amount: input.paidAmount,
      paidAmount: input.paidAmount,
      method,
      paymentStatus: "initiated",
      verificationStatus: "pending",
      receiverStatus: "pending",
      donorPaymentDetails: {
        donorAccountName: input.donorAccountName,
        donorAccountNumberOrMobile: input.donorAccountNumberOrMobile,
        transactionId: input.transactionId,
      },
      proofPaths,
      receiptNo,
    });

    res.status(201).json({ donation: created.toObject() });
  },
);

const createOfflineDonationSchema = z.object({
  amount: z.coerce.number().positive(),
  method: z
    .string()
    .min(1)
    .transform((v) => v.trim().toLowerCase())
    .refine((v) => v !== "paypal", { message: "PayPal donations must be created via PayPal checkout" }),
});

donationsRouter.post("/projects/:projectId/create-offline", async (req: Request, res: Response) => {
  const input = createOfflineDonationSchema.parse(req.body);

  const project = await Project.findById(req.params.projectId).lean().exec();
  if (!project || project.status !== "approved") {
    res.status(404).json({ message: "Project not found" });
    return;
  }

  const receiptNo = Donation.makeReceiptNo();
  const created = await Donation.create({
    projectId: project._id,
    donorId: req.user!.id,
    amount: input.amount,
    method: input.method,
    paymentStatus: "initiated",
    verificationStatus: "pending",
    receiptNo,
  });

  res.status(201).json({ donation: created.toObject() });
});

const createPayPalOrderSchema = z.object({
  amount: z.coerce.number().positive(),
  returnUrl: z.string().url(),
  cancelUrl: z.string().url(),
  currency: z.string().optional().default("USD"),
});

donationsRouter.post("/projects/:projectId/paypal/create-order", async (req: Request, res: Response) => {
  const input = createPayPalOrderSchema.parse(req.body);

  const project = await Project.findById(req.params.projectId).lean().exec();
  if (!project || project.status !== "approved") {
    res.status(404).json({ message: "Project not found" });
    return;
  }

  const order = await createPayPalOrder({
    amount: input.amount,
    currency: input.currency,
    projectTitle: project.title,
    returnUrl: input.returnUrl,
    cancelUrl: input.cancelUrl,
  });

  const receiptNo = Donation.makeReceiptNo();
  const created = await Donation.create({
    projectId: project._id,
    donorId: req.user!.id,
    amount: input.amount,
    method: "paypal",
    paymentStatus: "initiated",
    verificationStatus: "pending",
    provider: { type: "paypal", orderId: order.orderId },
    receiptNo,
  });

  res.status(201).json({
    donation: created.toObject(),
    paypal: { orderId: order.orderId, approveUrl: order.approveUrl },
  });
});

const capturePayPalSchema = z.object({
  donationId: z.string().min(1),
  orderId: z.string().min(1),
});

donationsRouter.post("/paypal/capture", async (req: Request, res: Response) => {
  const input = capturePayPalSchema.parse(req.body);

  const donation = await Donation.findById(input.donationId).exec();
  if (!donation) {
    res.status(404).json({ message: "Donation not found" });
    return;
  }

  if (donation.donorId.toString() !== req.user!.id) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  if (donation.method !== "paypal" || donation.provider?.orderId !== input.orderId) {
    res.status(400).json({ message: "Invalid PayPal donation" });
    return;
  }

  const capture = await capturePayPalOrder(input.orderId);

  donation.paymentStatus = "paid";
  donation.provider = {
    type: "paypal",
    orderId: input.orderId,
    captureId: capture.captureId,
  };
  await donation.save();

  res.json({ donation: donation.toObject() });
});

const uploadProofSchema = z.object({
  method: z.string().optional(),
});

donationsRouter.post(
  "/:id/proof",
  upload.array("proof", 10),
  async (req: Request, res: Response) => {
    uploadProofSchema.parse(req.body);

    const donation = await Donation.findById(req.params.id).exec();
    if (!donation) {
      res.status(404).json({ message: "Donation not found" });
      return;
    }

    if (donation.donorId.toString() !== req.user!.id) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      res.status(400).json({ message: "Proof upload is required" });
      return;
    }

    const paths = files.map((f) => toPublicUploadPath("donation-proofs", f.filename));
    donation.proofPaths = [...donation.proofPaths, ...paths];
    await donation.save();

    res.json({ donation: donation.toObject() });
  },
);
