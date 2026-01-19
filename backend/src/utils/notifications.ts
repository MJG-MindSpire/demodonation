import { Notification } from "../models/Notification.js";
import type { UserRole } from "../models/User.js";

type NotifyInput = {
  recipientId: string;
  recipientRole: UserRole;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  actorId?: string;
  data?: unknown;
};

export async function notify(input: NotifyInput) {
  try {
    await Notification.create({
      recipientId: input.recipientId,
      recipientRole: input.recipientRole,
      type: input.type,
      title: input.title,
      message: input.message,
      entityType: input.entityType,
      entityId: input.entityId,
      actorId: input.actorId,
      data: input.data,
    });
  } catch {
    // do not block primary flow
  }
}
