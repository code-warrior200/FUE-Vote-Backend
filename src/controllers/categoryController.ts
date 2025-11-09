import type { Request, Response } from "express";
import Category from "../models/Category";
import { asyncHandler } from "../middleware/asyncHandler";

export const getCategory = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await Category.find();
  res.status(200).json(categories);
});

