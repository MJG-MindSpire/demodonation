import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import multer from "multer";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    const first = err.issues[0];
    const message = first ? `${first.path.join(".") || "input"}: ${first.message}` : "Invalid input";
    res.status(400).json({ message });
    return;
  }

  if (err instanceof multer.MulterError) {
    res.status(400).json({ message: err.message });
    return;
  }

  if (err instanceof SyntaxError && "message" in err && /JSON/i.test(err.message)) {
    res.status(400).json({ message: "Invalid JSON body" });
    return;
  }

  const anyErr = err as any;
  const statusFromError =
    (typeof anyErr?.status === "number" && anyErr.status) ||
    (typeof anyErr?.statusCode === "number" && anyErr.statusCode) ||
    (typeof anyErr?.code === "number" && anyErr.code);

  if (anyErr?.name === "ValidationError") {
    res.status(400).json({ message: anyErr.message || "Invalid input" });
    return;
  }

  const status = statusFromError && statusFromError >= 400 && statusFromError < 600 ? statusFromError : 500;
  const message = err instanceof Error ? err.message : "Unexpected error";
  res.status(status).json({ message });
}
