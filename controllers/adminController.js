import Category from "../models/Category.js";
import Candidate from "../models/Candidate.js";
import Vote from "../models/Vote.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

/** Utility: Validate required candidate fields */
const validateCandidateInput = ({ name, position, department, image }) => {
  if (!name || !position || !department || !image) {
    return "All fields (name, position, department, image) are required.";
  }
  return null;
};

/** Utility: Build candidate summary with vote count */
const buildCandidateSummary = async (candidate) => ({
  candidateName: candidate.name,
  department: candidate.department,
  totalVotes: await Vote.countDocuments({ candidateId: candidate._id }),
});

/** Utility: Build category summary */
const buildCategorySummary = async (category) => {
  const candidates = await Candidate.find({ categoryId: category._id });
  const results = await Promise.all(candidates.map(buildCandidateSummary));

  return {
    category: category.name,
    totalCandidates: candidates.length,
    results,
  };
};

/**
 * @desc Get all candidates (flat list for admin summary)
 * @route GET /api/admin/candidates
 * @access Admin
 */
export const getAllCandidates = asyncHandler(async (req, res) => {
  const candidates = await Candidate.find().sort({ position: 1, name: 1 });
  res.status(200).json(candidates);
});

/**
 * @desc Get vote summary for all categories
 * @route GET /api/admin/vote-summary
 * @access Admin
 */
export const getVoteSummary = asyncHandler(async (req, res) => {
  const categories = await Category.find();
  const summary = await Promise.all(categories.map(buildCategorySummary));

  res.status(200).json({
    success: true,
    totalCategories: categories.length,
    summary,
  });
});

/**
 * @desc Add a new candidate
 * @route POST /api/admin/add-candidate
 * @access Admin
 */
export const addCandidate = asyncHandler(async (req, res) => {
  const { name, position, department, categoryId, image } = req.body;

  // Use image URL from frontend (Cloudinary) if available
  const candidateImage = image?.trim() || (req.file ? `/uploads/${req.file.filename}` : "");

  // Validate input
  const errorMsg = validateCandidateInput({ name, position, department, image: candidateImage });
  if (errorMsg) return res.status(400).json({ message: errorMsg });

  // Verify category exists if provided
  if (categoryId) {
    const categoryExists = await Category.findById(categoryId);
    if (!categoryExists) return res.status(404).json({ message: "Category not found." });
  }

  // Prevent duplicate candidate
  const existing = await Candidate.findOne({ name, position });
  if (existing) {
    return res.status(409).json({
      message: `Candidate "${name}" already exists for "${position}".`,
    });
  }

  // Create candidate
  const candidate = await Candidate.create({
    name,
    position,
    department,
    categoryId: categoryId || null,
    image: candidateImage,
  });

  res.status(201).json(candidate);
});

/**
 * @desc Get all candidates (public or admin view)
 * @route GET /api/candidates
 * @access Public/Admin
 */
export const getCandidates = asyncHandler(async (req, res) => {
  const candidates = await Candidate.find().sort({ position: 1, name: 1 });
  res.status(200).json(
    candidates.map((c) => ({
      _id: c._id,
      name: c.name,
      position: c.position,
      department: c.department,
      image: c.image,
      votes: c.votes || 0,
    }))
  );
});
