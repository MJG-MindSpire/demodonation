import { Router, type Request, type Response } from "express";
import { z } from "zod";

import { requireAuth, requireRole, requireUser } from "../middleware/auth.js";
import { Donation } from "../models/Donation.js";
import { Project } from "../models/Project.js";
import { notify } from "../utils/notifications.js";

export const receiverRouter = Router();

receiverRouter.use(requireAuth, requireRole(["receiver"]), requireUser);

receiverRouter.use((req: Request, res: Response, next) => {
  if ((req.user?.registrationStatus ?? "").toLowerCase() !== "verified") {
    res.status(403).json({ message: "Account pending admin verification" });
    return;
  }
  next();
});

receiverRouter.get("/donations", async (req: Request, res: Response) => {
  const status = typeof req.query.status === "string" ? req.query.status : "pending";
  if (status !== "pending" && status !== "approved" && status !== "rejected") {
    res.status(400).json({ message: "Invalid status" });
    return;
  }

  const projects = await Project.find({ receiverId: req.user!.id }).select("_id").lean().exec();
  const projectIds = projects.map((p) => p._id);

  const filter: any = { projectId: { $in: projectIds } };
  if (status === "pending") {
    filter.$or = [{ receiverStatus: "pending" }, { receiverStatus: { $exists: false } }];
  } else {
    filter.receiverStatus = status;
  }

  const donations = await Donation.find(filter)
    .populate("projectId", "title status requiredAmount collectedAmount")
    .sort({ createdAt: -1 })
    .lean()
    .exec();

  res.json({ donations });
});

const decisionSchema = z.object({ remark: z.string().optional().default("") });

receiverRouter.post("/donations/:id/approve", async (req: Request, res: Response) => {
  const input = decisionSchema.parse(req.body);

  const donation = await Donation.findById(req.params.id).exec();
  if (!donation) {
    res.status(404).json({ message: "Donation not found" });
    return;
  }

  const project = await Project.findById(donation.projectId).exec();
  if (!project) {
    res.status(404).json({ message: "Project not found" });
    return;
  }

  if (project.receiverId.toString() !== req.user!.id) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  if (!donation.proofPaths || donation.proofPaths.length === 0) {
    res.status(400).json({ message: "Payment proof is required before approval" });
    return;
  }

  if (donation.receiverStatus !== "approved") {
    donation.receiverStatus = "approved";
    donation.verificationStatus = "approved";
    donation.receiverRemark = input.remark;
    donation.receiverActionAt = new Date();
    await donation.save();

    await Project.updateOne({ _id: donation.projectId }, { $inc: { collectedAmount: donation.amount } }).exec();

    await notify({
      recipientId: donation.donorId.toString(),
      recipientRole: "donor",
      type: "donation.approved",
      title: "Donation Approved",
      message: `Your donation for \"${project.title}\" was approved (PKR ${Number(donation.amount ?? 0).toLocaleString()}).`,
      entityType: "donation",
      entityId: donation._id.toString(),
      actorId: req.user!.id,
      data: input.remark ? { remark: input.remark } : undefined,
    });
  }

  res.json({ donation: donation.toObject() });
});

receiverRouter.post("/donations/:id/reject", async (req: Request, res: Response) => {
  const input = decisionSchema.parse(req.body);

  const donation = await Donation.findById(req.params.id).exec();
  if (!donation) {
    res.status(404).json({ message: "Donation not found" });
    return;
  }

  const project = await Project.findById(donation.projectId).lean().exec();
  if (!project) {
    res.status(404).json({ message: "Project not found" });
    return;
  }

  if (project.receiverId.toString() !== req.user!.id) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  donation.receiverStatus = "rejected";
  donation.verificationStatus = "flagged";
  donation.receiverRemark = input.remark;
  donation.receiverActionAt = new Date();
  await donation.save();

  await notify({
    recipientId: donation.donorId.toString(),
    recipientRole: "donor",
    type: "donation.rejected",
    title: "Donation Rejected",
    message: `Your donation for \"${project.title}\" was rejected.`,
    entityType: "donation",
    entityId: donation._id.toString(),
    actorId: req.user!.id,
    data: input.remark ? { remark: input.remark } : undefined,
  });

  res.json({ donation: donation.toObject() });
});
