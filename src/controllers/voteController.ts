import type { Request, Response } from "express";
import mongoose from "mongoose";
import type { Server as SocketIOServer } from "socket.io";
import Candidate from "../models/Candidate";
import Vote from "../models/Vote";
import { asyncHandler } from "../middleware/asyncHandler";

type DemoVoteRecord = Record<string, Record<string, string>>;
type DemoCandidateVotes = Record<string, number>;

const demoVotes: DemoVoteRecord = {};
const demoCandidateVotes: DemoCandidateVotes = {};

const isValidObjectId = (id: string) => mongoose.Types.ObjectId.isValid(id);

const clearAllDemoVoteCaches = () => {
  Object.keys(demoVotes).forEach((key) => delete demoVotes[key]);
  Object.keys(demoCandidateVotes).forEach((key) => delete demoCandidateVotes[key]);
};

const clearDemoVoteCachesForPosition = (position: string, candidateIds: string[]) => {
  Object.keys(demoVotes).forEach((regNumber) => {
    if (demoVotes[regNumber]?.[position]) {
      delete demoVotes[regNumber][position];
      if (Object.keys(demoVotes[regNumber]).length === 0) {
        delete demoVotes[regNumber];
      }
    }
  });

  candidateIds.forEach((candidateId) => {
    if (demoCandidateVotes[candidateId]) {
      delete demoCandidateVotes[candidateId];
    }
  });
};

const emitVoteEvent = (
  io: SocketIOServer | undefined,
  candidate: { _id: mongoose.Types.ObjectId | string; position: string },
  isDemo: boolean
) => {
  if (io) {
    io.emit("vote_cast", {
      candidateId: candidate._id,
      position: candidate.position,
      isDemo,
    });
  }
};

interface CandidateVoteInput {
  _id: string;
  position: string;
  name?: string;
}

interface ProcessVotesParams {
  voterRegNumber: string;
  candidateIds: CandidateVoteInput[];
  isDemo?: boolean;
  io?: SocketIOServer;
}

export const processVotesAtomically = async ({
  voterRegNumber,
  candidateIds,
  isDemo = false,
  io,
}: ProcessVotesParams) => {
  const normalizedRegNumber = voterRegNumber.toUpperCase();

  if (isDemo) {
    const results: Array<{ position: string; status: string; message: string }> = [];
    for (const candidate of candidateIds) {
      const position = candidate.position;
      demoVotes[normalizedRegNumber] = demoVotes[normalizedRegNumber] || {};
      if (demoVotes[normalizedRegNumber][position]) {
        results.push({
          position,
          status: "error",
          message: `You have already voted for ${position} (demo mode).`,
        });
        continue;
      }
      demoVotes[normalizedRegNumber][position] = candidate._id;
      demoCandidateVotes[candidate._id] = (demoCandidateVotes[candidate._id] || 0) + 1;
      emitVoteEvent(io, candidate, true);
      results.push({
        position,
        status: "success",
        message: `✅ Your vote for "${candidate.name ?? candidate._id}" as "${position}" has been recorded (demo mode).`,
      });
    }
    return results;
  }

  const session = await mongoose.startSession();
  const results: Array<{ position: string; status: string; message: string }> = [];

  try {
    session.startTransaction();

    for (const candidate of candidateIds) {
      const position = candidate.position;

      const alreadyVoted = await Vote.findOne({ voterRegNumber: normalizedRegNumber, position }).session(session);
      if (alreadyVoted) {
        results.push({
          position,
          status: "error",
          message: `You have already voted for ${position}.`,
        });
        continue;
      }

      await Vote.create(
        [{ voterRegNumber: normalizedRegNumber, candidateId: candidate._id, position }],
        { session }
      );

      const { matchedCount } = await Candidate.updateOne(
        { _id: candidate._id },
        { $inc: { totalVotes: 1 } },
        { session }
      );
      if (matchedCount === 0) {
        throw new Error(`Candidate not found for id ${candidate._id}`);
      }

      emitVoteEvent(io, candidate, false);

      results.push({
        position,
        status: "success",
        message: `✅ Your vote for "${candidate.name ?? candidate._id}" as "${position}" has been recorded successfully.`,
      });
    }

    await session.commitTransaction();
    return results;
  } catch (error) {
    await session.abortTransaction();
    console.error("Atomic vote transaction failed:", error);
    return candidateIds.map((candidate) => ({
      position: candidate.position,
      status: "error",
      message: (error as Error).message || "Vote failed.",
    }));
  } finally {
    session.endSession();
  }
};

interface CastVoteBody {
  candidateId?: string;
  position?: string;
  votes?: Array<{ candidateId: string; position: string }>;
  isDemo?: boolean;
  voterRegNumber?: string;
}

export const castVote = asyncHandler(async (req: Request<unknown, unknown, CastVoteBody>, res: Response) => {
  const { candidateId, position, votes, isDemo } = req.body;
  const voterRegNumber = req.user?.regnumber || req.body.voterRegNumber;
  const io = req.app.get("io") as SocketIOServer | undefined;

  if (!voterRegNumber || typeof voterRegNumber !== "string" || !voterRegNumber.trim()) {
    return res.status(400).json({ success: false, message: "Missing voter registration number" });
  }

  const normalizedRegNumber = voterRegNumber.trim().toUpperCase();

  let candidateInputs: CandidateVoteInput[] = [];

  if (candidateId && position) {
    candidateInputs.push({ _id: candidateId, position });
  } else if (Array.isArray(votes) && votes.length > 0) {
    candidateInputs = votes.map((vote) => ({ _id: vote.candidateId, position: vote.position }));
  } else {
    return res.status(400).json({
      success: false,
      message: "Invalid request body. Provide candidateId/position or votes[].",
    });
  }

  const invalidCandidate = candidateInputs.find(({ _id }) => !isValidObjectId(_id));
  if (invalidCandidate) {
    return res.status(400).json({
      success: false,
      message: `Invalid candidate ID: ${invalidCandidate._id}`,
    });
  }

  const candidateDocs = await Candidate.find({ _id: { $in: candidateInputs.map((c) => c._id) } });
  const candidateMap = new Map(
    candidateDocs.map((candidate) => [candidate._id.toString(), candidate])
  );

  const missingCandidates = candidateInputs
    .filter((candidate) => !candidateMap.has(candidate._id))
    .map((candidate) => candidate._id);

  if (missingCandidates.length > 0) {
    return res.status(404).json({
      success: false,
      message: "One or more candidates were not found.",
      missingCandidateIds: missingCandidates,
    });
  }

  const preparedCandidateInputs = candidateInputs.map((candidate) => {
    const doc = candidateMap.get(candidate._id);
    return {
      ...candidate,
      position: doc?.position ?? candidate.position,
      name: doc?.name,
    };
  });

  const seenPositions = new Set<string>();
  for (const candidate of preparedCandidateInputs) {
    if (!candidate.position) {
      return res.status(500).json({
        success: false,
        message: `Candidate "${candidate._id}" has no position configured.`,
      });
    }

    if (seenPositions.has(candidate.position)) {
      return res.status(400).json({
        success: false,
        message: "You can only vote for one candidate per position in a single submission.",
      });
    }
    seenPositions.add(candidate.position);
  }

  const results = await processVotesAtomically({
    voterRegNumber: normalizedRegNumber,
    candidateIds: preparedCandidateInputs,
    isDemo,
    io,
  });

  res.status(200).json({
    success: true,
    message: "Vote submission complete.",
    results,
  });
});

export const getVoteSummary = asyncHandler(async (_req: Request, res: Response) => {
  const candidates = await Candidate.find();

  const summary = candidates.reduce<Record<string, Array<Record<string, unknown>>>>((acc, candidate) => {
    const position = candidate.position || "Unknown";
    const demoTotal = demoCandidateVotes[candidate._id.toString()] ?? 0;
    if (!acc[position]) acc[position] = [];
    acc[position].push({
      id: candidate._id,
      name: candidate.name,
      department: candidate.department,
      image: candidate.image,
      totalVotes: candidate.totalVotes || 0,
      demoVotes: demoTotal,
    });
    return acc;
  }, {});

  res.status(200).json(summary);
});

export const resetAllVotes = asyncHandler(async (_req: Request, res: Response) => {
  await Vote.deleteMany({});
  await Candidate.updateMany({}, { $set: { totalVotes: 0 } });

  clearAllDemoVoteCaches();

  res.status(200).json({ success: true, message: "All votes have been reset." });
});

export const resetVotes = asyncHandler(async (req: Request<unknown, unknown, { position?: string }>, res: Response) => {
  const { position } = req.body;
  if (!position) {
    return res.status(400).json({ success: false, message: "Position is required." });
  }

  const candidates = await Candidate.find({ position }, { _id: 1 });

  await Vote.deleteMany({ position });
  await Candidate.updateMany({ position }, { $set: { totalVotes: 0 } });

  clearDemoVoteCachesForPosition(
    position,
    candidates.map((candidate) => candidate._id.toString())
  );

  res.status(200).json({ success: true, message: `Votes for position "${position}" have been reset.` });
});

export const resetDemoVotes = asyncHandler(async (_req: Request, res: Response) => {
  clearAllDemoVoteCaches();
  await Candidate.updateMany({}, { $set: { totalVotes: 0 } });

  res.status(200).json({ success: true, message: "Demo votes have been reset." });
});

