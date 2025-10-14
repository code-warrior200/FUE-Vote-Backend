import Category from "../models/Category.js";
import Candidate from "../models/Candidate.js";
import Vote from "../models/Vote.js";

// @desc    Cast a vote for a candidate
// @route   POST /api/votes/cast
// @access  Public or Authenticated (depending on your setup)
export const castVote = async (req, res) => {
  try {
    const { candidateId, voterId } = req.body;

    // Validate candidate
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    // Optional: prevent double voting in the same category
    if (voterId) {
      const categoryId = candidate.categoryId;
      const alreadyVoted = await Vote.findOne({ voterId, categoryId });
      if (alreadyVoted) {
        return res.status(400).json({ message: "You have already voted in this category" });
      }
    }

    // Record the vote
    const vote = new Vote({
      candidateId,
      voterId: voterId || null,
      categoryId: candidate.categoryId,
    });

    await vote.save();
    res.status(201).json({ message: "Vote cast successfully", vote });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get vote summary for all categories and candidates
// @route   GET /api/votes/summary
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
