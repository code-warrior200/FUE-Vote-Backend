import mongoose from "mongoose";
import Candidate from "../models/Candidate.js";
import Vote from "../models/Vote.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

// 🧠 In-memory demo vote tracking
const demoVotes = {}; // { voterRegNumber: { position: candidateId } }
const demoCandidateVotes = {}; // { candidateId: totalVotes }

/** 🧩 Validate MongoDB ObjectId */
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/** 🧠 Record a demo vote */
const recordDemoVote = (voterRegNumber, candidate) => {
  if (!demoVotes[voterRegNumber]) demoVotes[voterRegNumber] = {};

  if (demoVotes[voterRegNumber][candidate.position]) {
    throw new Error(`You have already voted for "${candidate.position}" (demo mode).`);
  }

  demoVotes[voterRegNumber][candidate.position] = candidate._id;
  demoCandidateVotes[candidate._id] = (demoCandidateVotes[candidate._id] || 0) + 1;

  return {
    voterRegNumber,
    candidateId: candidate._id,
    position: candidate.position,
  };
};

/** 📡 Emit Socket.IO vote event */
const emitVoteEvent = (io, candidate, isDemo = false) => {
  if (io) {
    io.emit("vote_cast", {
      candidateId: candidate._id,
      position: candidate.position,
      isDemo,
    });
  }
};

/** 🛠️ Helper to process a single vote */
const processVote = async ({ voterRegNumber, candidate, isDemo, io }) => {
  try {
    if (isDemo) {
      recordDemoVote(voterRegNumber, candidate);
    } else {
      const alreadyVoted = await Vote.findOne({ voterRegNumber, position: candidate.position });
      if (alreadyVoted) {
        return {
          position: candidate.position,
          status: "skipped",
          message: `You have already voted for "${candidate.position}".`,
        };
      }

      await Vote.create({ voterRegNumber, candidateId: candidate._id, position: candidate.position });
      await Candidate.findByIdAndUpdate(candidate._id, { $inc: { totalVotes: 1 } });
    }

    emitVoteEvent(io, candidate, isDemo);

    return {
      position: candidate.position,
      status: "success",
      message: `✅ Your vote for "${candidate.name}" as "${candidate.position}" has been recorded ${
        isDemo ? "(demo mode)" : "successfully"
      }.`,
    };
  } catch (error) {
    return {
      position: candidate.position,
      status: "error",
      message: error.message || "Vote failed.",
    };
  }
};

/**
 * 🗳️ Cast one or multiple votes
 */
export const castVote = asyncHandler(async (req, res) => {
  const voterRegNumber = req.user?.regnumber;
  const isDemo = req.user?.isDemo || false;
  const io = req.io;

  if (!voterRegNumber) {
    return res.status(401).json({ success: false, message: "Unauthorized: voter identity missing." });
  }

  const { candidateId, votes } = req.body;

  const results = [];

  // Multi-vote
  if (Array.isArray(votes)) {
    for (const voteItem of votes) {
      const { candidateId } = voteItem;
      if (!candidateId || !isValidObjectId(candidateId)) {
        results.push({ position: voteItem.position, status: "error", message: "Invalid or missing candidate ID." });
        continue;
      }

      const candidate = await Candidate.findById(candidateId);
      if (!candidate) {
        results.push({ position: voteItem.position, status: "error", message: "Candidate not found." });
        continue;
      }

      const result = await processVote({ voterRegNumber, candidate, isDemo, io });
      results.push(result);
    }

    return res.status(200).json({ success: true, message: "Vote submission complete.", results });
  }

  // Single vote
  if (!candidateId || !isValidObjectId(candidateId)) {
    return res.status(400).json({ success: false, message: "Invalid or missing candidate ID." });
  }

  const candidate = await Candidate.findById(candidateId);
  if (!candidate) {
    return res.status(404).json({ success: false, message: "Candidate not found." });
  }

  const result = await processVote({ voterRegNumber, candidate, isDemo, io });
  const statusCode = result.status === "success" ? 201 : 400;
  return res.status(statusCode).json({ success: result.status === "success", ...result });
});

/**
 * 🧹 Reset all votes (Admin only)
 */
export const resetAllVotes = asyncHandler(async (req, res) => {
  await Vote.deleteMany({});
  await Candidate.updateMany({}, { totalVotes: 0 });

  Object.keys(demoVotes).forEach((v) => delete demoVotes[v]);
  Object.keys(demoCandidateVotes).forEach((c) => delete demoCandidateVotes[c]);

  res.status(200).json({ success: true, message: "✅ All votes have been reset." });
});

/**
 * 🧼 Reset votes for a specific position
 */
export const resetVotes = asyncHandler(async (req, res) => {
  const { position } = req.body;
  if (!position) return res.status(400).json({ success: false, message: "Position is required." });

  const candidates = await Candidate.find({ position });
  const ids = candidates.map((c) => c._id);

  await Vote.deleteMany({ candidateId: { $in: ids } });
  await Candidate.updateMany({ position }, { totalVotes: 0 });

  for (const voter in demoVotes) {
    if (demoVotes[voter][position]) delete demoVotes[voter][position];
  }

  res.status(200).json({ success: true, message: `✅ Votes for "${position}" have been reset.` });
});

/**
 * 📊 Get voting results
 */
export const getResults = asyncHandler(async (req, res) => {
  const candidates = await Candidate.find({})
    .select("name position totalVotes")
    .sort({ position: 1, totalVotes: -1 });

  const results = candidates.map((c) => ({
    name: c.name,
    position: c.position,
    totalVotes: c.totalVotes + (demoCandidateVotes[c._id] || 0),
  }));

  res.status(200).json({ success: true, results });
});
