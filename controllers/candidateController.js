import Candidate from "../models/Candidate.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

/**
 * @desc Get all candidates grouped by position
 * @route GET /api/candidates
 * @access Public or protected (depending on middleware)
 */
export const getAllCandidates = asyncHandler(async (req, res) => {
  // Get all distinct positions
  const positions = await Candidate.distinct("position");

  // Fetch candidates for each position concurrently
  const candidatesByPosition = await Promise.all(
    positions.map(async (position) => {
      const candidates = await Candidate.find({ position }).sort({ name: 1 });
      return [position, candidates];
    })
  );

  // Convert array of [position, candidates] into an object
  const result = Object.fromEntries(candidatesByPosition);

  res.status(200).json(result);
});
