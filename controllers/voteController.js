import mongoose from "mongoose";
import Candidate from "../models/Candidate.js";
import Vote from "../models/Vote.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

// 🧠 In-memory demo vote tracking
const demoVotes = {}; // { voterRegNumber: { position: candidateId } }
const demoCandidateVotes = {}; // { candidateId: totalVotes }

/** 🧩 Validate MongoDB ObjectId */
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/** 🧠 Record a demo vote (one vote per voter per position) */
const recordDemoVote = (voterRegNumber, candidate) => {
  const position = candidate.position;

  // Initialize voter record if missing
  demoVotes[voterRegNumber] = demoVotes[voterRegNumber] || {};

  // Prevent same voter from voting twice for the same position
  if (demoVotes[voterRegNumber][position]) {
    throw new Error(`You have already voted for ${position} (demo mode).`);
  }

  // Record vote
  demoVotes[voterRegNumber][position] = candidate._id;

  // Increment candidate's total votes
  demoCandidateVotes[candidate._id] = (demoCandidateVotes[candidate._id] || 0) + 1;

  return { voterRegNumber, candidateId: candidate._id, position };
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

/** 🛠️ Process a single vote */
const processVote = async ({ voterRegNumber, candidate, isDemo, io }) => {
  const position = candidate.position;

  try {
    if (isDemo) {
      recordDemoVote(voterRegNumber, candidate);
    } else {
      // ✅ Only prevent the same voter from voting twice per position
      const alreadyVoted = await Vote.findOne({ voterRegNumber, position });
      if (alreadyVoted) {
        return {
          position,
          status: "error",
          message: `You have already voted for ${position}.`,
        };
      }

      // ✅ Create vote
      await Vote.create({
        voterRegNumber,
        candidateId: candidate._id,
        position,
      });

      // ✅ Increment candidate's totalVotes
      await Candidate.findByIdAndUpdate(candidate._id, { $inc: { totalVotes: 1 } });
    }

    emitVoteEvent(io, candidate, isDemo);

    return {
      position,
      status: "success",
      message: `✅ Your vote for "${candidate.name}" as "${position}" has been recorded ${
        isDemo ? "(demo mode)" : "successfully"
      }.`,
    };
  } catch (error) {
    if (error.code === 11000) {
      return {
        candidate,
        status: "error",
        message: `You have already voted for ${candidate}.`,
      };
    }

    return {
      candidate,
      status: "error",
      message: error.message || "Vote failed.",
    };
  }
};

/** 👁️ View all votes by the logged-in voter */
export const getMyVotes = asyncHandler(async (req, res) => {
  const voterRegNumber = req.user?.regnumber?.trim().toUpperCase();

  if (!voterRegNumber) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: voter identity missing.",
    });
  }

  // Fetch all votes by this voter
  const votes = await Vote.find({ voterRegNumber })
    .populate("candidateId", "name position")
    .sort({ position: 1 });

  if (!votes.length) {
    return res.status(200).json({
      success: true,
      message: "You have not voted yet.",
      votes: [],
    });
  }

  // Format votes neatly
  const formatted = votes.map((v) => ({
    position: v.position,
    candidateName: v.candidateId?.name || "Candidate not found",
    candidateId: v.candidateId?._id,
    votedAt: v.createdAt,
  }));

  res.status(200).json({
    success: true,
    message: "Your voting record retrieved successfully.",
    totalVotes: formatted.length,
    votes: formatted,
  });
});


/** 🗳️ Cast one or multiple votes */
export const castVote = asyncHandler(async (req, res) => {
  const voterRegNumber = req.user?.regnumber;
  const isDemo = req.user?.isDemo || false;
  const io = req.io;

  if (!voterRegNumber) {
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized: voter identity missing." });
  }

  const { candidateId, votes } = req.body;

  // 🗳️ Multiple votes (array)
  if (Array.isArray(votes) && votes.length > 0) {
    const results = [];

    for (const v of votes) {
      const validId = v?.candidateId;
      if (!validId || !isValidObjectId(validId)) continue;

      const candidate = await Candidate.findById(validId);
      if (!candidate) continue;

      const result = await processVote({ voterRegNumber, candidate, isDemo, io });
      results.push(result);
    }

    const hasError = results.some((r) => r.status !== "success");
    return res.status(hasError ? 400 : 201).json({
      success: !hasError,
      results,
    });
  }

  // 🗳️ Single vote
  if (!candidateId || !isValidObjectId(candidateId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid or missing candidate ID." });
  }

  const candidate = await Candidate.findById(candidateId);
  if (!candidate) {
    return res
      .status(404)
      .json({ success: false, message: "Candidate not found." });
  }

  const result = await processVote({ voterRegNumber, candidate, isDemo, io });
  const statusCode = result.status === "success" ? 201 : 400;
  return res.status(statusCode).json({
    success: result.status === "success",
    message: result.message,
  });
});

/** 🧹 Reset all votes (Admin only) */
export const resetAllVotes = asyncHandler(async (req, res) => {
  await Vote.deleteMany({});
  await Candidate.updateMany({}, { totalVotes: 0 });

  Object.keys(demoVotes).forEach((v) => delete demoVotes[v]);
  Object.keys(demoCandidateVotes).forEach((c) => delete demoCandidateVotes[c]);

  res.status(200).json({ success: true, message: "✅ All votes have been reset." });
});

/** 🧼 Reset votes for a specific position */
export const resetVotes = asyncHandler(async (req, res) => {
  const { position } = req.body;
  if (!position)
    return res
      .status(400)
      .json({ success: false, message: "Position is required." });

  const candidates = await Candidate.find({ position });
  const ids = candidates.map((c) => c._id);

  await Vote.deleteMany({ candidateId: { $in: ids } });
  await Candidate.updateMany({ position }, { totalVotes: 0 });

  for (const voter in demoVotes) {
    if (demoVotes[voter]?.[position]) delete demoVotes[voter][position];
  }

  res
    .status(200)
    .json({ success: true, message: `✅ Votes for "${position}" have been reset.` });
});

/** 📊 Get voting results */
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

/** 📊 Get vote summary grouped by position */
export const getVoteSummary = asyncHandler(async (req, res) => {
  try {
    const candidates = await Candidate.find()
      .select("name position dept image totalVotes")
      .sort({ position: 1, totalVotes: -1 });

    // ✅ Group candidates by position
    const grouped = candidates.reduce((acc, candidate) => {
      if (!acc[candidate.position]) {
        acc[candidate.position] = {
          position: candidate.position,
          candidates: [],
        };
      }
      acc[candidate.position].candidates.push({
        id: candidate._id,
        name: candidate.name,
        dept: candidate.dept,
        image: candidate.image,
        totalVotes: candidate.totalVotes || 0,
      });
      return acc;
    }, {});

    res.status(200).json(Object.values(grouped));
  } catch (error) {
    console.error("Error fetching vote summary:", error);
    res.status(500).json({ success: false, message: "Failed to load vote summary." });
  }
});
