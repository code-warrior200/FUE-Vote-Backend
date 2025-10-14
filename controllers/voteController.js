import Vote from "../models/Vote.js";
import Candidate from "../models/Candidate.js";

export const castVote = async (req, res) => {
  try {
    const voterId = req.user._id; // from JWT middleware
    const { candidateId } = req.body;

    // ✅ Find candidate and its category
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    // ✅ Check if voter already voted in this category
    const alreadyVoted = await Vote.findOne({
      voterId,
      categoryId: candidate.categoryId,
    });

    if (alreadyVoted) {
      return res.status(400).json({ message: "You have already voted in this category" });
    }

    // ✅ Save new vote
    const vote = await Vote.create({
      voterId,
      candidateId,
      categoryId: candidate.categoryId,
    });

    res.status(201).json({ message: "Vote cast successfully", vote });
  } catch (error) {
    if (error.code === 11000) {
      // Unique index violation (double vote)
      return res.status(400).json({ message: "You have already voted in this category" });
    }
    res.status(500).json({ message: error.message });
  }
};
