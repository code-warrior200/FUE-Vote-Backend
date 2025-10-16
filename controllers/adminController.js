import Category from "../models/Category.js";
import Candidate from "../models/Candidate.js";
import Vote from "../models/Vote.js";

/**
 * @desc    Get a summary of all votes grouped by category
 * @route   GET /api/admin/vote-summary
 * @access  Admin only
 */
export const getVoteSummary = async (req, res) => {
  try {
    const categories = await Category.find();
    const summary = [];

    for (const category of categories) {
      const candidates = await Candidate.find({ categoryId: category._id });

      const results = await Promise.all(
        candidates.map(async (cand) => {
          const voteCount = await Vote.countDocuments({ candidateId: cand._id });
          return {
            candidateName: cand.name,
            department: cand.department,
            totalVotes: voteCount,
          };
        })
      );

      summary.push({
        category: category.name,
        totalCandidates: candidates.length,
        results,
      });
    }

    res.status(200).json({
      totalCategories: categories.length,
      summary,
    });
  } catch (error) {
    console.error("Error fetching vote summary:", error);
    res.status(500).json({ message: "Failed to get vote summary", error: error.message });
  }
};

export const addCandidate = async (req, res) => {
  try {
    const { name, party, position } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : "";

    if (!name || !party || !position) {
      return res.status(400).json({ message: "All required fields must be provided." });
    }

    const existing = await Candidate.findOne({ name, position });
    if (existing) {
      return res.status(400).json({ message: "Candidate already exists for this position." });
    }

    const candidate = await Candidate.create({
      name,
      department,
      position,
      image,
    });

    res.status(201).json({ message: "Candidate added successfully", candidate });
  } catch (error) {
    res.status(500).json({ message: "Server error while adding candidate" });
  }
};