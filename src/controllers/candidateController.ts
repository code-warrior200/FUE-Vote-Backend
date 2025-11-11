import type { Request, Response } from "express";
import Candidate from "../models/Candidate";
import Vote from "../models/Vote";
import { asyncHandler } from "../middleware/asyncHandler";

export const getAllCandidates = asyncHandler(async (_req: Request, res: Response) => {
  const candidates = await Candidate.find();

  if (!candidates || candidates.length === 0) {
    return res.status(404).json([]);
  }

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

  const formatted = candidates.map((candidate) => {
    // Use actual vote count from Vote collection, fallback to stored totalVotes
    const actualVoteCount = voteCountsMap.get(candidate._id.toString()) ?? candidate.totalVotes ?? 0;
    
    return {
      id: candidate._id,
      name: candidate.name,
      dept: candidate.department,
      image: candidate.image,
      position: candidate.position,
      votes: candidate.votes ?? 0,
      totalVotes: actualVoteCount,
    };
  });

  return res.status(200).json(formatted);
});

