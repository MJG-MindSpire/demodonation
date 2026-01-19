import mongoose, { type InferSchemaType } from "mongoose";

const appSettingsSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: false, trim: true },
    phone: { type: String, required: false, trim: true },
    logoPath: { type: String, required: false, trim: true },
  },
  { timestamps: true },
);

export type AppSettingsDoc = InferSchemaType<typeof appSettingsSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const AppSettings = (mongoose.models.AppSettings as mongoose.Model<AppSettingsDoc> | undefined) ??
  mongoose.model<AppSettingsDoc>("AppSettings", appSettingsSchema);
