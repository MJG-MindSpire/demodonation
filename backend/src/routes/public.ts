import { Router, type Request, type Response } from "express";

import { Project } from "../models/Project.js";
import { ProgressUpdate } from "../models/ProgressUpdate.js";

export const publicRouter = Router();

publicRouter.get("/projects", async (_req: Request, res: Response) => {
  const projects = await Project.find({ status: "approved" }).sort({ createdAt: -1 }).lean().exec();
  res.json({ projects });
});

publicRouter.get("/projects/:id", async (req: Request, res: Response) => {
  const project = await Project.findById(req.params.id).lean().exec();
  if (!project || project.status !== "approved") {
    res.status(404).json({ message: "Not found" });
    return;
  }

  const updates = await ProgressUpdate.find({ projectId: project._id, approvalStatus: "approved" })
    .sort({ createdAt: -1 })
    .lean()
    .exec();

  res.json({ project, updates });
});
