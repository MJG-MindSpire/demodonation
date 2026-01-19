import { Router, type Request, type Response } from "express";
import { z } from "zod";

import { requireAuth, requireRole } from "../middleware/auth.js";
import { Project } from "../models/Project.js";
import { Donation } from "../models/Donation.js";
import { ProgressUpdate } from "../models/ProgressUpdate.js";
import { User } from "../models/User.js";
import { notify } from "../utils/notifications.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole(["admin"]));

adminRouter.get("/projects", async (req: Request, res: Response) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const filter: any = {};
  if (status) filter.status = status;

  const projects = await Project.find(filter).sort({ createdAt: -1 }).lean().exec();
  res.json({ projects });
});

adminRouter.get("/projects/:id", async (req: Request, res: Response) => {
  const project = await Project.findById(req.params.id).lean().exec();
  if (!project) {
    res.status(404).json({ message: "Not found" });
    return;
  }
  res.json({ project });
});

const decisionSchema = z.object({ remark: z.string().optional().default("") });

adminRouter.post("/projects/:id/approve", async (req: Request, res: Response) => {
  const input = decisionSchema.parse(req.body);
  const project = await Project.findById(req.params.id).exec();
  if (!project) {
    res.status(404).json({ message: "Not found" });
    return;
  }

  project.status = "approved";
  project.adminRemark = input.remark;
  project.approvedAt = new Date();
  project.publishedAt = new Date();
  project.rejectedAt = undefined;
  await project.save();

  await notify({
    recipientId: project.receiverId.toString(),
    recipientRole: "receiver",
    type: "project.approved",
    title: "Request Approved",
    message: `Your request \"${project.title}\" has been approved.`,
    entityType: "project",
    entityId: project._id.toString(),
    actorId: req.auth?.userId,
  });

  res.json({ project: project.toObject() });
});

adminRouter.post("/projects/:id/reject", async (req: Request, res: Response) => {
  const input = decisionSchema.parse(req.body);
  const project = await Project.findById(req.params.id).exec();
  if (!project) {
    res.status(404).json({ message: "Not found" });
    return;
  }

  project.status = "rejected";
  project.adminRemark = input.remark;
  project.rejectedAt = new Date();
  await project.save();

  await notify({
    recipientId: project.receiverId.toString(),
    recipientRole: "receiver",
    type: "project.rejected",
    title: "Request Rejected",
    message: `Your request \"${project.title}\" has been rejected.`,
    entityType: "project",
    entityId: project._id.toString(),
    actorId: req.auth?.userId,
    data: input.remark ? { remark: input.remark } : undefined,
  });

  res.json({ project: project.toObject() });
});

const assignSchema = z.object({
  fieldWorkerIds: z.array(z.string().min(1)),
});

adminRouter.post("/projects/:id/assign-field", async (req: Request, res: Response) => {
  const input = assignSchema.parse(req.body);
  const project = await Project.findById(req.params.id).exec();
  if (!project) {
    res.status(404).json({ message: "Not found" });
    return;
  }

  project.assignedFieldWorkerIds = input.fieldWorkerIds as any;
  await project.save();
  res.json({ project: project.toObject() });
});

adminRouter.get("/donations", async (req: Request, res: Response) => {
  const verificationStatus = typeof req.query.verificationStatus === "string" ? req.query.verificationStatus : undefined;
  const receiverStatus = typeof req.query.receiverStatus === "string" ? req.query.receiverStatus : undefined;
  const projectId = typeof req.query.projectId === "string" ? req.query.projectId : undefined;

  const filter: any = {};
  if (verificationStatus) filter.verificationStatus = verificationStatus;
  if (receiverStatus) {
    if (receiverStatus === "pending") {
      filter.$or = [{ receiverStatus: "pending" }, { receiverStatus: { $exists: false } }];
    } else {
      filter.receiverStatus = receiverStatus;
    }
  }
  if (projectId) filter.projectId = projectId;

  const donations = await Donation.find(filter).sort({ createdAt: -1 }).lean().exec();
  res.json({ donations });
});

const donationReviewSchema = z.object({ remark: z.string().optional().default("") });

adminRouter.post("/donations/:id/approve", async (req: Request, res: Response) => {
  donationReviewSchema.parse(req.body);
  res.status(403).json({ message: "Donations are confirmed by receivers. Admin approval is disabled." });
});

adminRouter.post("/donations/:id/flag", async (req: Request, res: Response) => {
  donationReviewSchema.parse(req.body);
  res.status(403).json({ message: "Donations are confirmed by receivers. Admin flagging is disabled." });
});

adminRouter.get("/progress-updates", async (req: Request, res: Response) => {
  const approvalStatus = typeof req.query.approvalStatus === "string" ? req.query.approvalStatus : undefined;
  const filter: any = {};
  if (approvalStatus) filter.approvalStatus = approvalStatus;

  const updates = await ProgressUpdate.find(filter).sort({ createdAt: -1 }).lean().exec();
  res.json({ updates });
});

const progressReviewSchema = z.object({ remark: z.string().optional().default("") });

adminRouter.post("/progress-updates/:id/approve", async (req: Request, res: Response) => {
  const input = progressReviewSchema.parse(req.body);
  const update = await ProgressUpdate.findById(req.params.id).exec();
  if (!update) {
    res.status(404).json({ message: "Not found" });
    return;
  }

  if (update.approvalStatus !== "approved") {
    update.approvalStatus = "approved";
    update.adminRemark = input.remark;
    await update.save();

    await Project.updateOne(
      { _id: update.projectId },
      {
        $inc: { spentAmount: update.amountUsed },
        $max: { progressPercent: update.percentComplete },
      },
    ).exec();

    const project = await Project.findById(update.projectId).select("title").lean().exec();
    await notify({
      recipientId: update.fieldWorkerId.toString(),
      recipientRole: "field",
      type: "progress.approved",
      title: "Progress Update Approved",
      message: `Your progress update for \"${project?.title ?? "project"}\" was approved.`,
      entityType: "progressUpdate",
      entityId: update._id.toString(),
      actorId: req.auth?.userId,
      data: input.remark ? { remark: input.remark } : undefined,
    });
  }

  res.json({ update: update.toObject() });
});

adminRouter.post("/progress-updates/:id/reject", async (req: Request, res: Response) => {
  const input = progressReviewSchema.parse(req.body);
  const update = await ProgressUpdate.findById(req.params.id).exec();
  if (!update) {
    res.status(404).json({ message: "Not found" });
    return;
  }

  update.approvalStatus = "rejected";
  update.adminRemark = input.remark;
  await update.save();

  const project = await Project.findById(update.projectId).select("title").lean().exec();
  await notify({
    recipientId: update.fieldWorkerId.toString(),
    recipientRole: "field",
    type: "progress.rejected",
    title: "Progress Update Rejected",
    message: `Your progress update for \"${project?.title ?? "project"}\" was rejected.`,
    entityType: "progressUpdate",
    entityId: update._id.toString(),
    actorId: req.auth?.userId,
    data: input.remark ? { remark: input.remark } : undefined,
  });

  res.json({ update: update.toObject() });
});

const createFieldWorkerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).optional(),
});

const createReceiverSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).optional(),
});

adminRouter.get("/field-workers", async (_req: Request, res: Response) => {
  const list = await User.find({ role: "field" }).sort({ createdAt: -1 }).lean().exec();
  res.json({
    users: list.map((u: any) => ({
      id: u._id.toString(),
      email: u.email,
      role: u.role,
      name: u.name,
      fatherName: u.fatherName,
      phone: u.phone,
      address: u.address,
      cnic: u.cnic,
      registrationStatus: u.registrationStatus,
      isActive: u.isActive,
      createdAt: u.createdAt,
    })),
  });
});

adminRouter.post("/field-workers", async (req: Request, res: Response) => {
  const input = createFieldWorkerSchema.parse(req.body);
  const existing = await User.findOne({ email: input.email }).lean().exec();
  if (existing) {
    res.status(409).json({ message: "Email already in use" });
    return;
  }

  const passwordHash = await User.hashPassword(input.password);
  const user = await User.create({
    email: input.email,
    passwordHash,
    role: "field",
    name: input.name,
    registrationStatus: "verified",
  });

  res.status(201).json({ user: { id: user._id.toString(), email: user.email, role: user.role, name: user.name } });
});

const receiverStatusSchema = z.object({
  isActive: z.boolean().optional(),
});

adminRouter.post("/receivers/:id/verify", async (req: Request, res: Response) => {
  receiverStatusSchema.parse(req.body);

  const user = await User.findById(req.params.id).exec();
  if (!user || user.role !== "receiver") {
    res.status(404).json({ message: "Receiver not found" });
    return;
  }

  user.registrationStatus = "verified";
  await user.save();

  await notify({
    recipientId: user._id.toString(),
    recipientRole: "receiver",
    type: "receiver.verified",
    title: "Account Verified",
    message: "Your receiver account has been verified by admin.",
    entityType: "user",
    entityId: user._id.toString(),
    actorId: req.auth?.userId,
  });

  res.json({
    user: {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      fatherName: (user as any).fatherName,
      phone: user.phone,
      address: user.address,
      cnic: user.cnic,
      photoPath: user.photoPath,
      registrationStatus: (user as any).registrationStatus,
      isActive: user.isActive,
      createdAt: user.createdAt,
    },
  });
});

adminRouter.patch("/receivers/:id/status", async (req: Request, res: Response) => {
  const input = receiverStatusSchema.parse(req.body);
  if (typeof input.isActive !== "boolean") {
    res.status(400).json({ message: "isActive is required" });
    return;
  }

  const user = await User.findById(req.params.id).exec();
  if (!user || user.role !== "receiver") {
    res.status(404).json({ message: "Receiver not found" });
    return;
  }

  user.isActive = input.isActive;
  await user.save();

  res.json({
    user: {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      fatherName: (user as any).fatherName,
      phone: user.phone,
      address: user.address,
      cnic: user.cnic,
      photoPath: user.photoPath,
      registrationStatus: (user as any).registrationStatus,
      isActive: user.isActive,
      createdAt: user.createdAt,
    },
  });
});

const fieldWorkerStatusSchema = z.object({
  isActive: z.boolean().optional(),
});

adminRouter.post("/field-workers/:id/verify", async (req: Request, res: Response) => {
  fieldWorkerStatusSchema.parse(req.body);

  const user = await User.findById(req.params.id).exec();
  if (!user || user.role !== "field") {
    res.status(404).json({ message: "Field worker not found" });
    return;
  }

  user.registrationStatus = "verified";
  await user.save();

  await notify({
    recipientId: user._id.toString(),
    recipientRole: "field",
    type: "field.verified",
    title: "Account Verified",
    message: "Your field worker account has been verified by admin.",
    entityType: "user",
    entityId: user._id.toString(),
    actorId: req.auth?.userId,
  });

  res.json({
    user: {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      fatherName: (user as any).fatherName,
      phone: user.phone,
      address: user.address,
      cnic: user.cnic,
      registrationStatus: (user as any).registrationStatus,
      isActive: user.isActive,
      createdAt: user.createdAt,
    },
  });
});

adminRouter.patch("/field-workers/:id/status", async (req: Request, res: Response) => {
  const input = fieldWorkerStatusSchema.parse(req.body);
  if (typeof input.isActive !== "boolean") {
    res.status(400).json({ message: "isActive is required" });
    return;
  }

  const user = await User.findById(req.params.id).exec();
  if (!user || user.role !== "field") {
    res.status(404).json({ message: "Field worker not found" });
    return;
  }

  user.isActive = input.isActive;
  await user.save();

  res.json({
    user: {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      fatherName: (user as any).fatherName,
      phone: user.phone,
      address: user.address,
      cnic: user.cnic,
      registrationStatus: (user as any).registrationStatus,
      isActive: user.isActive,
      createdAt: user.createdAt,
    },
  });
});

adminRouter.get("/donors", async (_req: Request, res: Response) => {
  const donors = await User.find({ role: "donor" }).sort({ createdAt: -1 }).lean().exec();
  const donorIds = donors.map((d) => d._id);

  const stats = await Donation.aggregate([
    { $match: { donorId: { $in: donorIds } } },
    { $group: { _id: "$donorId", donationCount: { $sum: 1 }, totalAmount: { $sum: "$amount" } } },
  ]).exec();

  const byId = new Map<string, { donationCount: number; totalAmount: number }>();
  for (const s of stats as any[]) {
    byId.set(String(s._id), { donationCount: Number(s.donationCount ?? 0), totalAmount: Number(s.totalAmount ?? 0) });
  }

  res.json({
    donors: donors.map((d) => {
      const s = byId.get(d._id.toString()) ?? { donationCount: 0, totalAmount: 0 };
      return {
        id: d._id.toString(),
        email: d.email,
        role: d.role,
        name: d.name,
        phone: d.phone,
        city: d.city,
        address: d.address,
        cnic: d.cnic,
        photoPath: d.photoPath,
        isActive: d.isActive,
        createdAt: d.createdAt,
        donationCount: s.donationCount,
        totalAmount: s.totalAmount,
      };
    }),
  });
});

adminRouter.get("/receivers", async (_req: Request, res: Response) => {
  const list = await User.find({ role: "receiver" }).sort({ createdAt: -1 }).lean().exec();
  res.json({
    users: list.map((u: any) => ({
      id: u._id.toString(),
      email: u.email,
      role: u.role,
      name: u.name,
      fatherName: u.fatherName,
      phone: u.phone,
      address: u.address,
      cnic: u.cnic,
      photoPath: u.photoPath,
      registrationStatus: u.registrationStatus,
      isActive: u.isActive,
      createdAt: u.createdAt,
    })),
  });
});

adminRouter.post("/receivers", async (req: Request, res: Response) => {
  const input = createReceiverSchema.parse(req.body);
  const existing = await User.findOne({ email: input.email }).lean().exec();
  if (existing) {
    res.status(409).json({ message: "Email already in use" });
    return;
  }

  const passwordHash = await User.hashPassword(input.password);
  const user = await User.create({
    email: input.email,
    passwordHash,
    role: "receiver",
    name: input.name,
    registrationStatus: "verified",
  });

  res.status(201).json({ user: { id: user._id.toString(), email: user.email, role: user.role, name: user.name } });
});
