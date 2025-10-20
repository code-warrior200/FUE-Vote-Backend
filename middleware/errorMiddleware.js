// middleware/errorMiddleware.js

export const errorHandler = (err, req, res, next) => {
  console.error("❌ Unhandled error:", err);

  // Determine status code
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({ message: "Validation error", errors });
  }

  // Handle MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({ message: `Duplicate value for field: ${field}` });
  }

  // Default error response
  res.status(statusCode).json({
    message: err.message || "Server encountered an error",
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};
