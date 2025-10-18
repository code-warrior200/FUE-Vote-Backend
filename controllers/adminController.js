import Category from "../models/Category.js";
import Candidate from "../models/Candidate.js";
import Vote from "../models/Vote.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

/**
 * @desc    Get vote summary for all categories
 * @route   GET /api/admin/vote-summary
 * @access  Admin
 */
export const getVoteSummary = asyncHandler(async (req, res) => {
  const categories = await Category.find();

  const summary = await Promise.all(
    categories.map(async (category) => {
      const candidates = await Candidate.find({ categoryId: category._id });
      const results = await Promise.all(
        candidates.map(async (cand) => ({
          candidateName: cand.name,
          department: cand.department,
          totalVotes: await Vote.countDocuments({ candidateId: cand._id }),
        }))
      );

      return {
        category: category.name,
        totalCandidates: candidates.length,
        results,
      };
    })
  );

  res.status(200).json({
    success: true,
    totalCategories: categories.length,
    summary,
  });
});

/**
 * @desc    Add a new candidate
 * @route   POST /api/admin/add-candidate
 * @access  Admin
 */
export const addCandidate = asyncHandler(async (req, res) => {
  const { name, position, department, categoryId } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : "";

  // ✅ Validate input
  if (!name || !position || !department) {
    return res.status(400).json({
      success: false,
      message:
        "All required fields (name, party, position, department) must be provided.",
    });
  }

  // ✅ Optional: ensure category exists if categoryId provided
  if (categoryId) {
    const categoryExists = await Category.findById(categoryId);
    if (!categoryExists) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found." });
    }
  }

  // ✅ Prevent duplicate candidate for same position
  const existing = await Candidate.findOne({ name, position });
  if (existing) {
    return res.status(400).json({
      success: false,
      message: "Candidate already exists for this position.",
    });
  }

  // ✅ Create candidate
  const candidate = await Candidate.create({
    name,
    position,
    department,
    categoryId,
    image,
  });

  // ✅ Send success response
  res.status(201).json({
    success: true,
    message: "Candidate added successfully",
    candidate,
  });
});

export const getCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find().sort({ position: 1 });
    res.json(candidates);
  } catch (error) {
    console.error("Error fetching candidates:", error);
    res.status(500).json({ message: "Server error fetching candidates" });
  }
};
