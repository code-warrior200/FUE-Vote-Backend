import Vote from "../models/Vote.js";
import Candidate from "../models/Candidate.js";

// 🧾 CAST VOTE — voter can only vote once per category
export const castVote = async (req, res) => {
  try {
    const voterId = req.user._id;
    const { candidateId } = req.body;

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    // ✅ Check if user already voted in this category
    const alreadyVoted = await Vote.findOne({
      voterId,
      categoryId: candidate.categoryId,
    });

    if (alreadyVoted) {
      return res
        .status(400)
        .json({ message: "You have already voted in this category" });
    }

    const vote = await Vote.create({
      voterId,
      candidateId,
      categoryId: candidate.categoryId,
    });

    res.status(201).json({ message: "Vote cast successfully", vote });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "You have already voted in this category" });
    }
    res.status(500).json({ message: error.message });
  }
};

// 🧾 RESET ALL VOTES (ADMIN ONLY)
export const resetAllVotes = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied. Admins only." });
    }

    await Vote.deleteMany({});
    res.status(200).json({ message: "All votes have been reset successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🧾 RESET VOTES FOR A SPECIFIC CANDIDATE (ADMIN ONLY)
export const resetVotes = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied. Admins only." });
    }

    const { candidateId } = req.body;

    if (!candidateId) {
      return res.status(400).json({ message: "Candidate ID is required." });
    }

    const deleted = await Vote.deleteMany({ candidateId });

    res.status(200).json({
      message: `Votes for candidate ${candidateId} have been reset.`,
      deletedCount: deleted.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🧾 RESET VOTES BY CATEGORY (ADMIN ONLY)
export const resetVotesByCategory = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Access denied. Admins only." });
    }

    const { categoryId } = req.params;
    const deleted = await Vote.deleteMany({ categoryId });

    res.status(200).json({
      message: `Votes for category ${categoryId} have been reset.`,
      deletedCount: deleted.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🧾 RESET OWN VOTES (VOTER)
export const resetMyVotes = async (req, res) => {
  try {
    const voterId = req.user._id;

    const deleted = await Vote.deleteMany({ voterId });

    res.status(200).json({
      message: "Your votes have been reset successfully.",
      deletedCount: deleted.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
