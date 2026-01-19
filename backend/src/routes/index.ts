import { Router, type Request, type Response } from "express";

import { authRouter } from "./auth.js";
import { adminRouter } from "./admin.js";
import { portalRouter } from "./portal.js";
import { donationsRouter } from "./donations.js";
import { fieldRouter } from "./field.js";
import { notificationsRouter } from "./notifications.js";
import { projectsRouter } from "./projects.js";
import { publicRouter } from "./public.js";
import { receiverRouter } from "./receiver.js";
import { settingsRouter } from "./settings.js";

export const router = Router();

router.get("/", (_req: Request, res: Response) => {
  res.json({ name: "impact-flow-api" });
});

router.use("/auth", authRouter);
router.use("/admin", adminRouter);
router.use("/projects", projectsRouter);
router.use("/public", publicRouter);
router.use("/donations", donationsRouter);
router.use("/field", fieldRouter);
router.use("/receiver", receiverRouter);
router.use("/portal", portalRouter);
router.use("/settings", settingsRouter);
router.use("/notifications", notificationsRouter);
