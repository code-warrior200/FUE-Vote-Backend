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

/**
 * Verify and sync vote counts for all candidates from actual Vote records
 * This ensures data consistency between Candidate.totalVotes and actual Vote documents
 */
export const verifyAndSyncVoteCounts = async (): Promise<{
  synced: number;
  discrepancies: Array<{ candidateId: string; storedCount: number; actualCount: number }>;
}> => {
  const candidates = await Candidate.find();
  const discrepancies: Array<{ candidateId: string; storedCount: number; actualCount: number }> = [];

  for (const candidate of candidates) {
    const actualCount = await Vote.countDocuments({ candidateId: candidate._id });
    const storedCount = candidate.totalVotes || 0;

    if (actualCount !== storedCount) {
      discrepancies.push({
        candidateId: candidate._id.toString(),
        storedCount,
        actualCount,
      });

      // Sync the count
      await Candidate.updateOne({ _id: candidate._id }, { $set: { totalVotes: actualCount } });
    }
  }

  return {
    synced: discrepancies.length,
    discrepancies,
  };
};

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
    const duplicatePositions: string[] = [];
    
    // Check for duplicates first
    for (const candidate of candidateIds) {
      const position = candidate.position;
      demoVotes[normalizedRegNumber] = demoVotes[normalizedRegNumber] || {};
      if (demoVotes[normalizedRegNumber][position]) {
        duplicatePositions.push(position);
      }
    }

    // If any duplicates found, reject all votes
    if (duplicatePositions.length > 0) {
      return candidateIds.map((candidate) => ({
        position: candidate.position,
        status: "error",
        message: duplicatePositions.includes(candidate.position)
          ? `You have already voted for ${candidate.position} (demo mode). Duplicate voting is not allowed.`
          : `Cannot process vote: duplicate voting detected for ${duplicatePositions.join(", ")}.`,
      }));
    }

    // Process all votes if no duplicates
    for (const candidate of candidateIds) {
      const position = candidate.position;
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

    // Pre-check for existing votes BEFORE processing any votes
    // This ensures we fail fast if voter has already voted for any position
    const existingVotes = await Vote.find({
      voterRegNumber: normalizedRegNumber,
      position: { $in: candidateIds.map((c) => c.position) },
    }).session(session);

    if (existingVotes.length > 0) {
      const duplicatePositions = existingVotes.map((v) => v.position);
      await session.abortTransaction();
      return candidateIds.map((candidate) => ({
        position: candidate.position,
          status: "error",
        message: duplicatePositions.includes(candidate.position)
          ? `You have already voted for ${candidate.position}. Each voter can only vote once per position.`
          : `Cannot process vote: you have already voted for ${duplicatePositions.join(", ")}.`,
      }));
    }

    // Verify all candidates exist before creating votes
    const candidateIdsList = candidateIds.map((c) => new mongoose.Types.ObjectId(c._id));
    const existingCandidates = await Candidate.find({
      _id: { $in: candidateIdsList },
    }).session(session);

    if (existingCandidates.length !== candidateIds.length) {
      const foundIds = new Set(existingCandidates.map((c) => c._id.toString()));
      const missingIds = candidateIds.filter((c) => !foundIds.has(c._id));
      await session.abortTransaction();
      throw new Error(
        `One or more candidates not found: ${missingIds.map((c) => c._id).join(", ")}`
      );
    }

    // Process all votes atomically
    const voteDocuments = candidateIds.map((candidate) => ({
      voterRegNumber: normalizedRegNumber,
      candidateId: new mongoose.Types.ObjectId(candidate._id),
      position: candidate.position,
    }));

    // Create all votes in batch
    await Vote.insertMany(voteDocuments, { session });

    // Update vote counts for all candidates
    const updatePromises = candidateIds.map((candidate) =>
      Candidate.updateOne(
        { _id: candidate._id },
        { $inc: { totalVotes: 1 } },
        { session }
      )
    );

    const updateResults = await Promise.all(updatePromises);

    // Verify all updates succeeded
    for (let i = 0; i < updateResults.length; i++) {
      if (updateResults[i].matchedCount === 0) {
        throw new Error(`Failed to update vote count for candidate ${candidateIds[i]._id}`);
      }
      if (updateResults[i].modifiedCount === 0) {
        // This shouldn't happen, but log it for debugging
        console.warn(`Warning: Vote count was not modified for candidate ${candidateIds[i]._id}`);
      }
    }

    // Emit events for all votes
    candidateIds.forEach((candidate) => {
      emitVoteEvent(io, candidate, false);
    });

    // Create success results
    candidateIds.forEach((candidate) => {
      results.push({
        position: candidate.position,
        status: "success",
        message: `✅ Your vote for "${candidate.name ?? candidate._id}" as "${candidate.position}" has been recorded successfully.`,
      });
    });

    await session.commitTransaction();
    return results;
  } catch (error) {
    await session.abortTransaction();
    console.error("Atomic vote transaction failed:", error);
    
    // Check if it's a duplicate key error (MongoDB unique constraint violation)
    const errorMessage = (error as Error).message;
    if (errorMessage.includes("duplicate key") || errorMessage.includes("E11000")) {
      return candidateIds.map((candidate) => ({
        position: candidate.position,
        status: "error",
        message: `You have already voted for ${candidate.position}. Duplicate voting is not allowed.`,
      }));
    }

    return candidateIds.map((candidate) => ({
      position: candidate.position,
      status: "error",
      message: errorMessage || "Vote failed. Please try again.",
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

  // Pre-check for existing votes BEFORE processing (for non-demo votes)
  if (!isDemo) {
    const existingVotes = await Vote.find({
      voterRegNumber: normalizedRegNumber,
      position: { $in: preparedCandidateInputs.map((c) => c.position) },
    });

    if (existingVotes.length > 0) {
      const duplicatePositions = existingVotes.map((v) => v.position);
      return res.status(400).json({
        success: false,
        message: `You have already voted for the following position(s): ${duplicatePositions.join(", ")}. Each voter can only vote once per position.`,
        duplicatePositions,
      });
    }
  }

  const results = await processVotesAtomically({
    voterRegNumber: normalizedRegNumber,
    candidateIds: preparedCandidateInputs,
    isDemo,
    io,
  });

  // Check if any votes failed
  const hasErrors = results.some((result) => result.status === "error");
  const statusCode = hasErrors ? (results.every((r) => r.status === "error") ? 400 : 207) : 200;

  res.status(statusCode).json({
    success: !hasErrors,
    message: hasErrors
      ? "Some votes could not be processed. Please check the results."
      : "Vote submission complete.",
    results,
  });
});

export const getVoteSummary = asyncHandler(async (_req: Request, res: Response) => {
  const candidates = await Candidate.find();

  // Get actual vote counts from Vote collection to ensure accuracy
  const voteCountsMap = new Map<string, number>();
  const voteCounts = await Vote.aggregate([
    {
      $group: {
        _id: "$candidateId",
        count: { $sum: 1 },
      },
    },
  ]);

  voteCounts.forEach((vc) => {
    voteCountsMap.set(vc._id.toString(), vc.count);
  });

  const summary = candidates.reduce<Record<string, Array<Record<string, unknown>>>>((acc, candidate) => {
    const position = candidate.position || "Unknown";
    const demoTotal = demoCandidateVotes[candidate._id.toString()] ?? 0;
    // Use actual vote count from Vote collection, fallback to stored totalVotes
    const actualVoteCount = voteCountsMap.get(candidate._id.toString()) ?? candidate.totalVotes ?? 0;
    
    if (!acc[position]) acc[position] = [];
    acc[position].push({
      id: candidate._id,
      name: candidate.name,
      department: candidate.department,
      image: candidate.image,
      totalVotes: actualVoteCount,
      demoVotes: demoTotal,
    });
    return acc;
  }, {});

  res.status(200).json(summary);
});

export const resetAllVotes = asyncHandler(async (_req: Request, res: Response) => {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();

    // Delete all votes first
    await Vote.deleteMany({}).session(session);
    
    // Reset all candidate vote counts
    await Candidate.updateMany({}, { $set: { totalVotes: 0 } }).session(session);

    await session.commitTransaction();
    
    // Clear demo vote caches (outside transaction as it's in-memory)
  clearAllDemoVoteCaches();

  res.status(200).json({ success: true, message: "All votes have been reset." });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

export const resetVotes = asyncHandler(async (req: Request<unknown, unknown, { position?: string }>, res: Response) => {
  const { position } = req.body;
  if (!position) {
    return res.status(400).json({ success: false, message: "Position is required." });
  }

  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();

    // Get candidates for this position
    const candidates = await Candidate.find({ position }, { _id: 1 }).session(session);

    // Delete all votes for this position
    await Vote.deleteMany({ position }).session(session);
    
    // Recalculate vote counts for candidates in this position from remaining votes
    // (in case there are votes for other positions, we need to preserve those counts)
    for (const candidate of candidates) {
      const remainingVoteCount = await Vote.countDocuments({ candidateId: candidate._id }).session(session);
      await Candidate.updateOne(
        { _id: candidate._id },
        { $set: { totalVotes: remainingVoteCount } }
      ).session(session);
    }

    await session.commitTransaction();
    
    // Clear demo vote caches (outside transaction as it's in-memory)
  clearDemoVoteCachesForPosition(
    position,
    candidates.map((candidate) => candidate._id.toString())
  );

  res.status(200).json({ success: true, message: `Votes for position "${position}" have been reset.` });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

export const resetDemoVotes = asyncHandler(async (_req: Request, res: Response) => {
  clearAllDemoVoteCaches();
  await Candidate.updateMany({}, { $set: { totalVotes: 0 } });

  res.status(200).json({ success: true, message: "Demo votes have been reset." });
});

/**
 * Admin endpoint to verify and sync vote counts
 * This ensures Candidate.totalVotes matches actual Vote document counts
 */
export const verifyVoteCounts = asyncHandler(async (_req: Request, res: Response) => {
  const result = await verifyAndSyncVoteCounts();
  
  res.status(200).json({
    success: true,
    message: result.synced > 0 
      ? `Verified and synced ${result.synced} candidate vote count(s).`
      : "All vote counts are accurate. No discrepancies found.",
    synced: result.synced,
    discrepancies: result.discrepancies,
  });
});

