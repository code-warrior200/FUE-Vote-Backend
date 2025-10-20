import mongoose from "mongoose";
import Candidate from "../models/Candidate.js";
import Vote from "../models/Vote.js";

export const castVote = async (req, res) => {
  try {
    // ✅ Ensure authenticated voter
    if (!req.user || !req.user.regnumber) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: voter identity missing.",
      });
    }

    const voterRegNumber = req.user.regnumber;
    const { candidateId } = req.body;

    // 🧾 Debug log (optional but useful)
    console.log("🧾 Incoming vote request:", {
      voterRegNumber,
      candidateId,
    });

    // ✅ Validate candidate ID
    if (!candidateId || !mongoose.Types.ObjectId.isValid(candidateId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing candidate ID.",
      });
    }

    // ✅ Find candidate
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found.",
      });
    }

    // ✅ Prevent double voting for same position
    const alreadyVoted = await Vote.findOne({
      voterRegNumber,
      position: candidate.position,
    });

    if (alreadyVoted) {
      return res.status(400).json({
        success: false,
        message: `You have already voted for the position of "${candidate.position}".`,
      });
    }

    // ✅ Record new vote
    const vote = await Vote.create({
      voterRegNumber,
      candidateId,
      position: candidate.position,
    });

    // ✅ Safely increment candidate votes
    await Candidate.findByIdAndUpdate(candidateId, { $inc: { totalVotes: 1 } });

    console.log(`🗳️ ${voterRegNumber} voted for ${candidate.name} (${candidate.position})`);

    return res.status(201).json({
      success: true,
      message: `✅ Your vote for "${candidate.name}" as "${candidate.position}" has been recorded successfully.`,
      data: vote,
    });

  } catch (error) {
    console.error("❌ Error casting vote:", error);

    // ✅ Handle MongoDB duplicate key (E11000)
    if (error.code === 11000) {
      const dupPosition = error.keyValue?.position || "this position";
      return res.status(400).json({
        success: false,
        message: `You have already voted for ${dupPosition}.`,
      });
    }

    // ✅ Handle Mongoose validation errors gracefully
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // ❌ Fallback: Internal server error
    return res.status(500).json({
      success: false,
      message: "Internal server error while casting vote.",
    });
  }
};

// 🧹 Reset all votes (Admin only)
export const resetAllVotes = async (req, res) => {
  try {
    await Vote.deleteMany({});
    await Candidate.updateMany({}, { totalVotes: 0 });
    return res.status(200).json({ message: "✅ All votes have been reset." });
  } catch (err) {
    console.error("❌ Error resetting all votes:", err);
    return res.status(500).json({ message: "Failed to reset votes." });
  }
};

// 🧹 Reset votes for one position
export const resetVotes = async (req, res) => {
  try {
    const { position } = req.body;
    if (!position)
      return res.status(400).json({ message: "Position is required." });

    const candidates = await Candidate.find({ position });
    const ids = candidates.map((c) => c._id);

    await Vote.deleteMany({ candidateId: { $in: ids } });
    await Candidate.updateMany({ position }, { totalVotes: 0 });

    return res.status(200).json({
      message: `✅ Votes for "${position}" have been reset.`,
    });
  } catch (err) {
    console.error("❌ Error resetting votes:", err);
    return res.status(500).json({ message: "Failed to reset votes." });
  }
};

// 📊 Get voting results
export const getResults = async (req, res) => {
  try {
    const results = await Candidate.find({})
      .select("name position totalVotes -_id")
      .sort({ position: 1, totalVotes: -1 }); 
    return res.status(200).json({ results });
  } catch (err) {
    console.error("❌ Error fetching results:", err);
    return res.status(500).json({ message: "Failed to fetch results." });
  } 
};
