import mongoose, { type InferSchemaType } from "mongoose";
import type { UserRole } from "./User.js";

const notificationSchema = new mongoose.Schema(
  {
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    recipientRole: { type: String, required: true, index: true },

    type: { type: String, required: true, trim: true, index: true },

    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },

    entityType: { type: String, required: false, trim: true },
    entityId: { type: String, required: false, trim: true },

    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },

    data: { type: mongoose.Schema.Types.Mixed, required: false },

    readAt: { type: Date, required: false, index: true },
  },
  { timestamps: true },
);

notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, readAt: 1 });

export type NotificationDoc = InferSchemaType<typeof notificationSchema> & {
  _id: mongoose.Types.ObjectId;
  recipientRole: UserRole;
};

export const Notification = mongoose.models.Notification ?? mongoose.model<NotificationDoc>("Notification", notificationSchema);
