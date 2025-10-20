import express from "express";
import { loginUser } from "../controllers/authController.js";

const router = express.Router();

// ======= SWAGGER TAGS =======
export const swaggerAuthTags = {
  tags: [
    {
      name: "Auth",
      description: "Authentication and user login",
    },
  ],
};

// ======= SWAGGER ROUTE DEFINITIONS =======
export const swaggerAuthRoutes = {
  "/auth/login": {
    post: {
      summary: "User login",
      description: "Authenticates a user using their credentials and returns a JWT token if successful.",
      tags: ["Auth"],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["username", "password"],
              properties: {
                username: { type: "string", example: "admin" },
                password: { type: "string", example: "admin123" },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Login successful, returns a JWT token and user data.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string", example: "Login successful" },
                  token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
                  user: {
                    type: "object",
                    properties: {
                      id: { type: "integer", example: 1 },
                      username: { type: "string", example: "admin" },
                    },
                  },
                },
              },
            },
          },
        },
        400: { description: "Bad request - Missing or invalid data." },
        401: { description: "Unauthorized - Invalid credentials." },
        500: { description: "Internal server error." },
      },
    },
  },
};

// ======= ROUTES =======
router.post("/login", loginUser);

export default router;
