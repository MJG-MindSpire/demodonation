import mongoose, { type InferSchemaType } from "mongoose";
import bcrypt from "bcryptjs";

export const USER_ROLES = ["admin", "donor", "field", "receiver"] as const;
export type UserRole = (typeof USER_ROLES)[number];

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      required: true,
      enum: USER_ROLES,
    },
    name: {
      type: String,
      required: false,
      trim: true,
    },
    fatherName: {
      type: String,
      required: false,
      trim: true,
    },
    phone: {
      type: String,
      required: false,
      trim: true,
    },
    city: {
      type: String,
      required: false,
      trim: true,
    },
    address: {
      type: String,
      required: false,
      trim: true,
    },
    cnic: {
      type: String,
      required: false,
      trim: true,
    },
    photoPath: {
      type: String,
      required: false,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    registrationStatus: {
      type: String,
      required: false,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.methods.verifyPassword = async function verifyPassword(password: string) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.statics.hashPassword = async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export type UserDoc = InferSchemaType<typeof userSchema> & {
  _id: mongoose.Types.ObjectId;
  verifyPassword(password: string): Promise<boolean>;
};

export type UserModel = mongoose.Model<UserDoc> & {
  hashPassword(password: string): Promise<string>;
};

export const User = (mongoose.models.User as UserModel | undefined) ??
  mongoose.model<UserDoc, UserModel>("User", userSchema);
