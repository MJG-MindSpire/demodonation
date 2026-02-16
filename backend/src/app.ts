import "express-async-errors";
import cors from "cors";
import express, { type Request, type Response } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import path from "path";

import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import { router } from "./routes/index.js";

export function createApp() {
  const app = express();

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      crossOriginEmbedderPolicy: false,
    }),
  );
  const allowedOrigins = new Set<string>([
    env.CLIENT_ORIGIN,
    "http://127.0.0.1:8080",
    "http://localhost:8080",
    "https://demodonation.healthspire.org",
    "https://healthspire.org",
  ]);
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || origin === "null") return callback(null, true);
        if (allowedOrigins.has(origin)) return callback(null, true);
        // Allow any subdomain of healthspire.org in production
        if (env.NODE_ENV === "production" && origin.endsWith(".healthspire.org")) return callback(null, true);
        return callback(null, false);
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan("dev"));
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
      standardHeaders: "draft-7",
      legacyHeaders: false,
    }),
  );

  app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.use("/api", router);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
