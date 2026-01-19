import mongoose, { type InferSchemaType } from "mongoose";

export const WORK_STATUSES = ["pending", "ongoing", "completed"] as const;
export type WorkStatus = (typeof WORK_STATUSES)[number];

export const UPDATE_APPROVAL_STATUSES = ["pending", "approved", "rejected"] as const;
export type UpdateApprovalStatus = (typeof UPDATE_APPROVAL_STATUSES)[number];

const progressUpdateSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    fieldWorkerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    stepKey: { type: String, required: true },
    stepTitle: { type: String, required: true },

    workStatus: { type: String, required: true, enum: WORK_STATUSES, default: "pending" },
    percentComplete: { type: Number, required: true, min: 0, max: 100 },

    amountUsed: { type: Number, required: true, default: 0, min: 0 },

    notes: { type: String, required: false, trim: true },
    mediaPaths: { type: [String], default: [] },

    approvalStatus: { type: String, required: true, enum: UPDATE_APPROVAL_STATUSES, default: "pending", index: true },
    adminRemark: { type: String, required: false, trim: true },
  },
  { timestamps: true },
);

progressUpdateSchema.index({ projectId: 1, createdAt: -1 });

export type ProgressUpdateDoc = InferSchemaType<typeof progressUpdateSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ProgressUpdate = (mongoose.models.ProgressUpdate as mongoose.Model<ProgressUpdateDoc> | undefined) ??
  mongoose.model<ProgressUpdateDoc>("ProgressUpdate", progressUpdateSchema);
