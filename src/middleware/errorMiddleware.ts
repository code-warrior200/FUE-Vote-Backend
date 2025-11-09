import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error("❌ Unhandled error:", err);

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  if ((err as { name?: string }).name === "ValidationError" && err.errors) {
    const errors = Object.values(err.errors as Record<string, { message: string }>).map(
      (val) => val.message
    );
    return res.status(400).json({ message: "Validation error", errors });
  }

  if ((err as { code?: number }).code === 11000 && err.keyValue) {
    const field = Object.keys(err.keyValue as Record<string, string>)[0];
    return res.status(400).json({ message: `Duplicate value for field: ${field}` });
  }

  return res.status(statusCode).json({
    message: (err as Error).message || "Server encountered an error",
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

