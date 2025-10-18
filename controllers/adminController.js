import Category from "../models/Category.js";
import Candidate from "../models/Candidate.js";
import Vote from "../models/Vote.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

// GET /api/admin/vote-summary
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
    totalCategories: categories.length,
    summary,
  });
});

// POST /api/admin/add-candidate
export const addCandidate = asyncHandler(async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ message: "Request body is missing." });
  }

  const { name, party, position, department } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : "";

  if (!name || !party || !position || !department) {
    return res.status(400).json({
      message: "All required fields (name, party, position, department) must be provided.",
    });
  }

  const existing = await Candidate.findOne({ name, position });
  if (existing) {
    return res.status(400).json({ message: "Candidate already exists for this position." });
  }

  const candidate = await Candidate.create({ name, party, position, department, image });
  res.status(201).json({ message: "Candidate added successfully", candidate });
});
