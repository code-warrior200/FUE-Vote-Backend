import express from "express";

const router = express.Router();

// ======= SWAGGER TAGS =======
export const swaggerCategoryTags = {
  tags: [
    {
      name: "Categories",
      description: "Category management and retrieval",
    },
  ],
};

// ======= SWAGGER ROUTE DEFINITIONS =======
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

// ======= ROUTES =======
router.get("/", (req, res) => {
  res.json([{ id: 1, name: "Best Developer" }]);
});

router.post("/", (req, res) => {
  // In a real app, you would save the category from req.body here
  res.status(201).json({ message: "Category created" });
});

export default router;
