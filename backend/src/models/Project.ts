import mongoose, { type InferSchemaType } from "mongoose";

export const PROJECT_CATEGORIES = [
  "education",
  "medical",
  "food",
  "construction",
  "emergency",
  "other",
] as const;
export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export const PROJECT_STATUSES = ["pending", "approved", "rejected", "completed"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const URGENCY_LEVELS = ["low", "medium", "high"] as const;
export type UrgencyLevel = (typeof URGENCY_LEVELS)[number];

const projectStepSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    title: { type: String, required: true },
    order: { type: Number, required: true },
  },
  { _id: false },
);

const projectSchema = new mongoose.Schema(
  {
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    receiverDetails: {
      fullName: { type: String, required: false, trim: true },
      fatherOrOrgName: { type: String, required: false, trim: true },
      cnicOrIdNumber: { type: String, required: false, trim: true },
      phone: { type: String, required: false, trim: true },
      alternatePhone: { type: String, required: false, trim: true },
      city: { type: String, required: false, trim: true },
      fullAddress: { type: String, required: false, trim: true },
    },

    title: { type: String, required: true, trim: true },
    purpose: { type: String, required: true, trim: true },

    requiredAmount: { type: Number, required: true, min: 1 },
    collectedAmount: { type: Number, required: true, default: 0, min: 0 },
    spentAmount: { type: Number, required: true, default: 0, min: 0 },

    category: { type: String, required: true, enum: PROJECT_CATEGORIES },
    urgencyLevel: { type: String, required: true, enum: URGENCY_LEVELS, default: "medium" },

    description: { type: String, required: true, trim: true },
    usageBreakdown: { type: String, required: false, trim: true },
    durationText: { type: String, required: false, trim: true },
    verificationMediaPaths: { type: [String], required: true, default: [] },
    timelineStart: { type: Date, required: false },
    timelineEnd: { type: Date, required: false },

    steps: { type: [projectStepSchema], default: [] },

    paymentAccounts: {
      bank: {
        bankName: { type: String, required: false, trim: true },
        accountHolderName: { type: String, required: false, trim: true },
        accountNumber: { type: String, required: false, trim: true },
        iban: { type: String, required: false, trim: true },
      },
      jazzcash: {
        accountName: { type: String, required: false, trim: true },
        mobileNumber: { type: String, required: false, trim: true },
      },
      easypaisa: {
        accountName: { type: String, required: false, trim: true },
        mobileNumber: { type: String, required: false, trim: true },
      },
    },

    status: { type: String, required: true, enum: PROJECT_STATUSES, default: "pending", index: true },
    adminRemark: { type: String, required: false, trim: true },

    approvedAt: { type: Date, required: false },
    rejectedAt: { type: Date, required: false },
    publishedAt: { type: Date, required: false },

    assignedFieldWorkerIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },

    progressPercent: { type: Number, required: true, default: 0, min: 0, max: 100 },
  },
  { timestamps: true },
);

projectSchema.index({ status: 1, createdAt: -1 });

export type ProjectDoc = InferSchemaType<typeof projectSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Project = (mongoose.models.Project as mongoose.Model<ProjectDoc> | undefined) ??
  mongoose.model<ProjectDoc>("Project", projectSchema);
