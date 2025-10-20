import Vote from "../models/Vote.js";
import Candidate from "../models/Candidate.js";

/**
 * @desc Cast a vote for a candidate
 * @route POST /api/vote
 * @access Private (voter only)
 */

export const castVote = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: user not found.",
      });
    }

    const voterId = req.user._id;
    const { candidateId } = req.body;

    if (!candidateId || !mongoose.Types.ObjectId.isValid(candidateId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing candidate ID.",
      });
    }

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found.",
      });
    }

    const alreadyVoted = await Vote.findOne({
      voterId,
      position: candidate.position,
    });

    if (alreadyVoted) {
      return res.status(400).json({
        success: false,
        message: `You have already voted for "${candidate.position}".`,
      });
    }

    const vote = await Vote.create({
      voterId,
      candidateId,
      position: candidate.position,
    });

    await Candidate.findByIdAndUpdate(candidateId, { $inc: { totalVotes: 1 } });

    return res.status(201).json({
      success: true,
      message: `✅ Your vote for "${candidate.name}" as "${candidate.position}" has been recorded successfully.`,
      data: vote,
    });
  } catch (error) {
    console.error("❌ Error casting vote:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while casting vote.",
    });
  }
};

/**
 * @desc Reset all votes (admin only)
 * @route DELETE /api/admin/reset-all
 * @access Private (admin)
 */
export const resetAllVotes = async (req, res) => {
  try {
    await Vote.deleteMany({});
    await Candidate.updateMany({}, { $set: { totalVotes: 0 } });

    return res.status(200).json({
      success: true,
      message: "✅ All votes have been reset successfully.",
    });
  } catch (error) {
    console.error("❌ Error resetting all votes:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while resetting votes.",
    });
  }
};

/**
 * @desc Reset votes for a specific position (admin only)
 * @route POST /api/admin/reset
 * @access Private (admin)
 */
export const resetVotes = async (req, res) => {
  try {
    const { position } = req.body;
    if (!position) {
      return res.status(400).json({
        success: false,
        message: "Position is required.",
      });
    }

    // Delete votes for that position
    await Vote.deleteMany({ position });

    // Reset candidate vote count for that position
    await Candidate.updateMany(
      { position },
      { $set: { totalVotes: 0 } }
    );

    return res.status(200).json({
      success: true,
      message: `✅ Votes for the "${position}" position have been reset.`,
    });
  } catch (error) {
    console.error("❌ Error resetting position votes:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while resetting position votes.",
    });
  }
};
