import express, { type Request, type Response } from "express";
import { getCategory } from "../controllers/categoryController";

const router = express.Router();

export const swaggerCategoryTags = {
  tags: [
    {
      name: "Categories",
      description: "Category management and retrieval",
    },
  ],
};

export const swaggerCategoryRoutes = {
  "/categories": {
    get: {
      summary: "Get all categories",
      description: "Retrieve a list of all available categories.",
      tags: ["Categories"],
      responses: {
        200: {
          description: "Successfully retrieved categories.",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "integer", example: 1 },
                    name: { type: "string", example: "Best Developer" },
                  },
                },
              },
            },
          },
        },
        500: { description: "Internal server error." },
      },
    },
    post: {
      summary: "Create a new category",
      description: "Add a new category to the system.",
      tags: ["Categories"],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                name: { type: "string", example: "Best Designer" },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Category created successfully.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string", example: "Category created" },
                },
              },
            },
          },
        },
        400: { description: "Bad request — missing or invalid data." },
        500: { description: "Internal server error." },
      },
    },
  },
};

router.get("/", getCategory);

router.post("/", (_req: Request, res: Response) => {
  res.status(201).json({ message: "Category created" });
});

export default router;

