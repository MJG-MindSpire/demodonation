import mongoose, { type InferSchemaType } from "mongoose";

export const DONATION_METHODS = ["paypal", "payoneer", "cash", "bank", "jazzcash", "easypaisa"] as const;
export type DonationMethod = string;

export const PAYMENT_STATUSES = ["initiated", "paid", "failed"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const VERIFICATION_STATUSES = ["pending", "approved", "flagged"] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const RECEIVER_STATUSES = ["pending", "approved", "rejected"] as const;
export type ReceiverStatus = (typeof RECEIVER_STATUSES)[number];

const donationSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    donorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    amount: { type: Number, required: true, min: 1 },

    method: { type: String, required: true, trim: true },
    paymentStatus: { type: String, required: true, enum: PAYMENT_STATUSES, default: "initiated", index: true },
    verificationStatus: { type: String, required: true, enum: VERIFICATION_STATUSES, default: "pending", index: true },

    receiverStatus: { type: String, required: true, enum: RECEIVER_STATUSES, default: "pending", index: true },
    receiverRemark: { type: String, required: false, trim: true },
    receiverActionAt: { type: Date, required: false },

    paidAmount: { type: Number, required: false, min: 1 },
    donorPaymentDetails: {
      donorAccountName: { type: String, required: false, trim: true },
      donorAccountNumberOrMobile: { type: String, required: false, trim: true },
      transactionId: { type: String, required: false, trim: true },
    },

    proofPaths: { type: [String], default: [] },

    provider: {
      type: {
        type: String,
        required: false,
      },
      orderId: { type: String, required: false },
      captureId: { type: String, required: false },
    },

    adminRemark: { type: String, required: false, trim: true },

    receiptNo: { type: String, required: true, unique: true, index: true },
  },
  { timestamps: true },
);

donationSchema.index({ donorId: 1, createdAt: -1 });

donationSchema.statics.makeReceiptNo = function makeReceiptNo() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `RCPT-${ts}-${rand}`;
};

export type DonationDoc = InferSchemaType<typeof donationSchema> & {
  _id: mongoose.Types.ObjectId;
};

export type DonationModel = mongoose.Model<DonationDoc> & {
  makeReceiptNo(): string;
};

export const Donation = (mongoose.models.Donation as DonationModel | undefined) ??
  mongoose.model<DonationDoc, DonationModel>("Donation", donationSchema);
