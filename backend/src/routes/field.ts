import { Router, type Request, type Response } from "express";
import { z } from "zod";

import { requireAuth, requireRole, requireUser } from "../middleware/auth.js";
import { Project } from "../models/Project.js";
import { ProgressUpdate, WORK_STATUSES } from "../models/ProgressUpdate.js";
import { createUploader, toPublicUploadPath } from "../utils/uploads.js";

export const fieldRouter = Router();

const upload = createUploader("progress-media");

fieldRouter.use(requireAuth, requireRole(["field"]), requireUser);

fieldRouter.get("/projects", async (req: Request, res: Response) => {
  const projects = await Project.find({
    status: "approved",
    assignedFieldWorkerIds: req.user!.id,
  })
    .sort({ createdAt: -1 })
    .lean()
    .exec();

  res.json({ projects });
});

fieldRouter.get("/projects/:projectId", async (req: Request, res: Response) => {
  const project = await Project.findById(req.params.projectId).lean().exec();
  if (!project) {
    res.status(404).json({ message: "Project not found" });
    return;
  }

  const assigned = (project.assignedFieldWorkerIds ?? []).some((id) => id.toString() === req.user!.id);
  if (!assigned) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  res.json({ project });
});

fieldRouter.get("/projects/:projectId/progress", async (req: Request, res: Response) => {
  const project = await Project.findById(req.params.projectId).lean().exec();
  if (!project) {
    res.status(404).json({ message: "Project not found" });
    return;
  }

  const assigned = (project.assignedFieldWorkerIds ?? []).some((id) => id.toString() === req.user!.id);
  if (!assigned) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  const updates = await ProgressUpdate.find({ projectId: project._id, fieldWorkerId: req.user!.id })
    .sort({ createdAt: -1 })
    .lean()
    .exec();

  res.json({ updates });
});

const createUpdateSchema = z.object({
  stepKey: z.string().min(1),
  workStatus: z.enum(WORK_STATUSES),
  percentComplete: z.coerce.number().min(0).max(100),
  amountUsed: z.coerce.number().min(0).default(0),
  notes: z.string().optional().default(""),
});

fieldRouter.post(
  "/projects/:projectId/progress",
  upload.array("media", 20),
  async (req: Request, res: Response) => {
    const input = createUpdateSchema.parse(req.body);

    const project = await Project.findById(req.params.projectId).lean().exec();
    if (!project) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    const assigned = (project.assignedFieldWorkerIds ?? []).some((id) => id.toString() === req.user!.id);
    if (!assigned) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const step = (project.steps ?? []).find((s: any) => s.key === input.stepKey);
    if (!step) {
      res.status(400).json({ message: "Invalid step" });
      return;
    }

    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      res.status(400).json({ message: "At least one proof file is required" });
      return;
    }

    const mediaPaths = files.map((f) => toPublicUploadPath("progress-media", f.filename));

    const created = await ProgressUpdate.create({
      projectId: project._id,
      fieldWorkerId: req.user!.id,
      stepKey: step.key,
      stepTitle: step.title,
      workStatus: input.workStatus,
      percentComplete: input.percentComplete,
      amountUsed: input.amountUsed,
      notes: input.notes,
      mediaPaths,
      approvalStatus: "pending",
    });

    res.status(201).json({ update: created.toObject() });
  },
);
