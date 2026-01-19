import mongoose, { type InferSchemaType } from "mongoose";
import bcrypt from "bcryptjs";

export const PORTAL_KEYS = ["admin", "donor", "field", "receiver"] as const;
export type PortalKey = (typeof PORTAL_KEYS)[number];

const portalCredentialSchema = new mongoose.Schema(
  {
    portalKey: {
      type: String,
      required: true,
      enum: PORTAL_KEYS,
      index: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true },
);

portalCredentialSchema.index({ portalKey: 1, username: 1 }, { unique: true });

portalCredentialSchema.methods.verifyPassword = async function verifyPassword(password: string) {
  return bcrypt.compare(password, this.passwordHash);
};

portalCredentialSchema.statics.hashPassword = async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export type PortalCredentialDoc = InferSchemaType<typeof portalCredentialSchema> & {
  _id: mongoose.Types.ObjectId;
  verifyPassword(password: string): Promise<boolean>;
};

export type PortalCredentialModel = mongoose.Model<PortalCredentialDoc> & {
  hashPassword(password: string): Promise<string>;
};

export const PortalCredential = (mongoose.models.PortalCredential as PortalCredentialModel | undefined) ??
  mongoose.model<PortalCredentialDoc, PortalCredentialModel>("PortalCredential", portalCredentialSchema);
