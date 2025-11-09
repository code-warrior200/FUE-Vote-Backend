import type { Request, Response } from "express";
import Candidate, { type CandidateDocument } from "../models/Candidate";
import Category, { type CategoryDocument } from "../models/Category";
import Vote from "../models/Vote";
import { asyncHandler } from "../middleware/asyncHandler";

export interface VoterRecord {
  regnumber: string;
}

export const voters: VoterRecord[] = [
  { regnumber: "EZ/CSC1001/2025" },
  { regnumber: "EZ/CSC1002/2025" },
  { regnumber: "EZ/MTH1003/2025" },
  { regnumber: "EZ/BCH1004/2025" },
  { regnumber: "EZ/ENG1005/2025" },
  { regnumber: "EZ/PHY1006/2025" },
  { regnumber: "EZ/BIO1007/2025" },
  { regnumber: "EZ/STA1008/2025" },
  { regnumber: "EZ/ECO1009/2025" },
  { regnumber: "EZ/ACC1010/2025" },
];

const validateCandidateInput = ({
  name,
  position,
  department,
  image,
}: {
  name?: string;
  position?: string;
  department?: string;
  image?: string;
}) => {
  if (!name || !position || !department || !image) {
    return "All fields (name, position, department, image) are required.";
  }
  return null;
};

const buildCandidateSummary = async (candidate: CandidateDocument) => ({
  candidateName: candidate.name,
  department: candidate.department,
  totalVotes: await Vote.countDocuments({ candidateId: candidate._id }),
});

const buildCategorySummary = async (category: CategoryDocument) => {
  const candidates = await Candidate.find({ categoryId: category._id });
  const results = await Promise.all(candidates.map((candidate) => buildCandidateSummary(candidate)));

  return {
    category: category.name,
    totalCandidates: candidates.length,
    results,
  };
};

type RequestWithFile = Request & { file?: Express.Multer.File };

export const getAllCandidates = asyncHandler(async (_req: Request, res: Response) => {
  const candidates = await Candidate.find().sort({ position: 1, name: 1 });
  res.status(200).json(candidates);
});

export const getVoteSummary = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await Category.find();
  const summary = await Promise.all(categories.map((category) => buildCategorySummary(category)));

  res.status(200).json({
    success: true,
    totalCategories: categories.length,
    summary,
  });
});

export const addCandidate = asyncHandler(async (req: RequestWithFile, res: Response) => {
  const { name, position, department, categoryId, image } = req.body as Record<string, string | undefined>;

  const candidateImage =
    image?.trim() || (req.file ? `/uploads/${req.file.filename}` : "");

  const errorMsg = validateCandidateInput({ name, position, department, image: candidateImage });
  if (errorMsg) {
    return res.status(400).json({ message: errorMsg });
  }

  if (categoryId) {
    const categoryExists = await Category.findById(categoryId);
    if (!categoryExists) {
      return res.status(404).json({ message: "Category not found." });
    }
  }

  const existing = await Candidate.findOne({ name, position });
  if (existing) {
    return res.status(409).json({
      message: `Candidate "${name}" already exists for "${position}".`,
    });
  }

  const candidate = await Candidate.create({
    name,
    position,
    department,
    categoryId: categoryId ?? null,
    image: candidateImage,
  });

  res.status(201).json(candidate);
});

export const getCandidates = asyncHandler(async (_req: Request, res: Response) => {
  const candidates = await Candidate.find().sort({ position: 1, name: 1 });

  res.status(200).json(
    candidates.map((candidate) => ({
      _id: candidate._id,
      id: candidate._id,
      name: candidate.name,
      position: candidate.position,
      department: candidate.department,
      image: candidate.image,
      votes: candidate.votes ?? 0,
      totalVotes: candidate.totalVotes,
    }))
  );
});

