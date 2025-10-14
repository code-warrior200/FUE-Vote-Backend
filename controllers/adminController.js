import Category from "../models/Category.js";
import Candidate from "../models/Candidate.js";
import Vote from "../models/Vote.js";

// @desc    Get vote summary for all categories and candidates
// @route   GET /api/admin/vote-summary
// @access  Admin
export const getVoteSummary = async (req, res) => {
  try {
    const categories = await Category.find();
    const summary = {};

    for (let category of categories) {
      const candidates = await Candidate.find({ categoryId: category._id });

      const results = await Promise.all(
        candidates.map(async (cand) => {
          const count = await Vote.countDocuments({ candidateId: cand._id });
          return {
            candidateName: cand.name,
            totalVotes: count,
          };
        })
      );

      summary[category.name] = results;
    }

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
