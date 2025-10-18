// middleware/errorMiddleware.js
export const errorHandler = (err, req, res, next) => {
  console.error("Unhandled error:", err);

  // Default to 500 if statusCode not set
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  // Mongoose validation errors
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({ message: "Validation error", errors: messages });
  }

  // MongoDB duplicate key error
  if (err.code && err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({ message: `Duplicate value for field: ${field}` });
  }

  res.status(statusCode).json({
    message: err.message || "Server encountered an error",
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};
