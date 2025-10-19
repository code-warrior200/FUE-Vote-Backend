import Category from "../models/Category.js";
import Candidate from "../models/Candidate.js";
import Vote from "../models/Vote.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

/**
 * @desc Get all candidates (flat list for admin summary)
 * @route GET /api/admin/candidates
 * @access Admin
 */
export const getAllCandidates = asyncHandler(async (req, res) => {
  const candidates = await Candidate.find().sort({ position: 1, name: 1 });
  return res.status(200).json(candidates); // ✅ frontend expects a plain array
});

/**
 * @desc Get vote summary for all categories
 * @route GET /api/admin/vote-summary
 * @access Admin
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
 * @desc Add a new candidate
 * @route POST /api/admin/add-candidate
 * @access Admin
 */
export const addCandidate = asyncHandler(async (req, res) => {
  const { name, position, department, categoryId, image } = req.body;

  // Use image URL from frontend (Cloudinary) if available
  const candidateImage = image && image.trim() !== "" 
    ? image 
    : (req.file ? `/uploads/${req.file.filename}` : "");



  // ✅ Validate input
  if (!name || !position || !department || !image) {
    return res.status(400).json({
      message: "All fields (name, position, department, image) are required.",
    });
  }

  // ✅ Optional: verify category exists
  if (categoryId) {
    const categoryExists = await Category.findById(categoryId);
    if (!categoryExists) {
      return res.status(404).json({ message: "Category not found." });
    }
  }

  // ✅ Prevent duplicate candidate
  const existing = await Candidate.findOne({ name, position });
  if (existing) {
    return res
      .status(409)
      .json({ message: `Candidate "${name}" already exists for "${position}".` });
  }

  // ✅ Create candidate
  const candidate = await Candidate.create({
    name,
    position,
    department,
    categoryId: categoryId || null,
    image: candidateImage, // ✅ use the Cloudinary URL
  });


  // ✅ Return plain object for frontend
  res.status(201).json(candidate);
});

/**
 * @desc Get all candidates (public or admin view)
 * @route GET /api/candidates
 * @access Public/Admin
 */
export const getCandidates = asyncHandler(async (req, res) => {
  const candidates = await Candidate.find().sort({ position: 1, name: 1 });

  // ✅ Return an array only — not wrapped in { success: true }
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
