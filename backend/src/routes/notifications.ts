import { Router, type Request, type Response } from "express";
import { z } from "zod";

import { requireAuth, requireUser } from "../middleware/auth.js";
import { Notification } from "../models/Notification.js";

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth, requireUser);

notificationsRouter.get("/mine", async (req: Request, res: Response) => {
  const limitRaw = typeof req.query.limit === "string" ? Number.parseInt(req.query.limit, 10) : 50;
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 50;

  const beforeRaw = typeof req.query.before === "string" ? new Date(req.query.before) : undefined;
  const before = beforeRaw && !Number.isNaN(beforeRaw.getTime()) ? beforeRaw : undefined;

  const filter: any = { recipientId: req.user!.id };
  if (before) filter.createdAt = { $lt: before };

  const list = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()
    .exec();

  res.json({
    notifications: list.map((n: any) => ({
      id: n._id.toString(),
      type: n.type,
      title: n.title,
      message: n.message,
      createdAt: n.createdAt,
      readAt: n.readAt ?? null,
      data: n.data ?? null,
      entityType: n.entityType ?? null,
      entityId: n.entityId ?? null,
      actorId: n.actorId ? n.actorId.toString() : null,
    })),
  });
});

notificationsRouter.get("/unread-count", async (req: Request, res: Response) => {
  const count = await Notification.countDocuments({ recipientId: req.user!.id, readAt: { $exists: false } });
  res.json({ unreadCount: count });
});

const markReadSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

notificationsRouter.post("/mark-read", async (req: Request, res: Response) => {
  const input = markReadSchema.parse(req.body);

  const now = new Date();
  const result = await Notification.updateMany(
    {
      _id: { $in: input.ids },
      recipientId: req.user!.id,
      readAt: { $exists: false },
    },
    { $set: { readAt: now } },
  ).exec();

  res.json({ updated: result.modifiedCount ?? 0 });
});
