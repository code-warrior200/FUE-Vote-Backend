import Category from "../models/Category.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

/**
 * @desc Get all categories
 * @route GET /api/categories
 * @access Public
 */
export const getCategory = asyncHandler(async (req, res) => {
  const categories = await Category.find();
  res.status(200).json(categories);
});
