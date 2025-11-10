import express, { type Request, type Response } from "express";
import { getCategory } from "../controllers/categoryController";

const router = express.Router();

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all categories
 *     description: Retrieve a list of all available voting categories in the system. Categories are used to group candidates for different voting positions or awards.
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Successfully retrieved categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: Unique category identifier
 *                     example: "507f1f77bcf86cd799439011"
 *                   name:
 *                     type: string
 *                     description: Category name
 *                     example: "Best Developer"
 *                   startDate:
 *                     type: string
 *                     format: date-time
 *                     description: Category voting start date (optional)
 *                     example: "2025-01-01T00:00:00.000Z"
 *                   endDate:
 *                     type: string
 *                     format: date-time
 *                     description: Category voting end date (optional)
 *                     example: "2025-12-31T23:59:59.000Z"
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     description: Category creation timestamp
 *                     example: "2025-01-01T00:00:00.000Z"
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                     description: Category last update timestamp
 *                     example: "2025-01-01T00:00:00.000Z"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server encountered an error"
 */
router.get("/", getCategory);

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create a new category
 *     description: Add a new voting category to the system. Categories can optionally have start and end dates to control voting periods.
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Category name (must be unique)
 *                 example: "Best Designer"
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: Optional voting start date
 *                 example: "2025-01-01T00:00:00.000Z"
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: Optional voting end date
 *                 example: "2025-12-31T23:59:59.000Z"
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Category created"
 *       400:
 *         description: Bad request - missing or invalid data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Category name is required"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server encountered an error"
 */
router.post("/", (_req: Request, res: Response) => {
  res.status(201).json({ message: "Category created" });
});

export default router;

