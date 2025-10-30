import mongoose from "mongoose";
import Candidate from "../models/Candidate.js";
import Vote from "../models/Vote.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const demoVotes = {};
const demoCandidateVotes = {};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const emitVoteEvent = (io, candidate, isDemo = false) => {
  if (io) {
    io.emit("vote_cast", {
      candidateId: candidate._id,
      position: candidate.position,
      isDemo,
    });
  }
};

// 🧠 Internal logic used by castVote
export const processVotesAtomically = async ({ voterRegNumber, candidateIds, isDemo = false, io }) => {
  if (isDemo) {
    const results = [];
    for (const candidate of candidateIds) {
      const position = candidate.position;
      demoVotes[voterRegNumber] = demoVotes[voterRegNumber] || {};
      if (demoVotes[voterRegNumber][position]) {
        results.push({
          position,
          status: "error",
          message: `You have already voted for ${position} (demo mode).`,
        });
        continue;
      }
      demoVotes[voterRegNumber][position] = candidate._id;
      demoCandidateVotes[candidate._id] = (demoCandidateVotes[candidate._id] || 0) + 1;
      emitVoteEvent(io, candidate, true);
      results.push({
        position,
        status: "success",
        message: `✅ Your vote for "${candidate.name}" as "${position}" has been recorded (demo mode).`,
      });
    }
    return results;
  }

  // Real DB voting (transaction)
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const results = [];

    for (const candidate of candidateIds) {
      const position = candidate.position;

      const alreadyVoted = await Vote.findOne({ voterRegNumber, position }).session(session);
      if (alreadyVoted) {
        results.push({
          position,
          status: "error",
          message: `You have already voted for ${position}.`,
        });
        continue;
      }

      await Vote.create([{ voterRegNumber, candidateId: candidate._id, position }], { session });

      await Candidate.findByIdAndUpdate(
        candidate._id,
        { $inc: { totalVotes: 1 } },
        { session }
      );

      emitVoteEvent(io, candidate, false);

      results.push({
        position,
        status: "success",
        message: `✅ Your vote for "${candidate.name}" as "${position}" has been recorded successfully.`,
      });
    }

    await session.commitTransaction();
    session.endSession();

    return results;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Atomic vote transaction failed:", error);
    return candidateIds.map((c) => ({
      position: c.position,
      status: "error",
      message: error.message || "Vote failed.",
    }));
  }
};

// ✅ NEW — castVote endpoint
export const castVote = asyncHandler(async (req, res) => {
  const { candidateId, position, votes, isDemo } = req.body;
  const voterRegNumber = req.user?.regNumber || req.body.voterRegNumber;
  const io = req.app.get("io");

  if (!voterRegNumber) {
    return res.status(400).json({ success: false, message: "Missing voterRegNumber" });
  }

  let candidateIds = [];

  if (candidateId && position) {
    candidateIds.push({ _id: candidateId, position });
  } else if (Array.isArray(votes) && votes.length > 0) {
    candidateIds = votes.map((v) => ({ _id: v.candidateId, position: v.position }));
  } else {
    return res.status(400).json({
      success: false,
      message: "Invalid request body. Provide candidateId/position or votes[].",
    });
  }

  const results = await processVotesAtomically({
    voterRegNumber,
    candidateIds,
    isDemo,
    io,
  });

  res.status(200).json({
    success: true,
    message: "Vote submission complete.",
    results,
  });
});

// ✅ NEW — getVoteSummary endpoint
export const getVoteSummary = asyncHandler(async (req, res) => {
  const candidates = await Candidate.find();

  const summary = candidates.reduce((acc, c) => {
    const position = c.position || "Unknown";
    if (!acc[position]) acc[position] = [];
    acc[position].push({
      id: c._id,
      name: c.name,
      dept: c.dept,
      image: c.image,
      totalVotes: c.totalVotes || 0,
    });
    return acc;
  }, {});

  res.status(200).json(summary);
});
