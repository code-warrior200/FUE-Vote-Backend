import type { Request, Response } from "express";
import Candidate from "../models/Candidate";
import { asyncHandler } from "../middleware/asyncHandler";

export const getAllCandidates = asyncHandler(async (_req: Request, res: Response) => {
  const candidates = await Candidate.find();

  if (!candidates || candidates.length === 0) {
    return res.status(404).json([]);
  }

  const formatted = candidates.map((candidate) => ({
    id: candidate._id,
    name: candidate.name,
    dept: candidate.department,
    image: candidate.image,
    position: candidate.position,
    votes: candidate.votes ?? 0,
    totalVotes: candidate.totalVotes,
  }));

  return res.status(200).json(formatted);
});

