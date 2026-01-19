import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().default(5000),
  MONGO_URI: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CLIENT_ORIGIN: z.string().url().default("http://localhost:8080"),
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),

  PAYPAL_MODE: z.enum(["sandbox", "live"]).optional(),
  PAYPAL_CLIENT_ID: z.string().optional(),
  PAYPAL_CLIENT_SECRET: z.string().optional(),

  PAYONEER_MODE: z.enum(["sandbox", "live"]).optional(),
  PAYONEER_CLIENT_ID: z.string().optional(),
  PAYONEER_CLIENT_SECRET: z.string().optional(),
});

export const env = schema.parse(process.env);
