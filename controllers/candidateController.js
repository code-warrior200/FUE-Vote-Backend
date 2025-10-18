import Candidate from "../models/Candidate.js";

/**
 * @desc Get all candidates grouped by position
 * @route GET /api/candidates
 * @access Public or protected (depending on middleware)
 */
export const getAllCandidates = async (req, res) => {
  try {
    // ✅ Get all distinct positions (e.g., President, Secretary, etc.)
    const positions = await Candidate.distinct("position");

    // ✅ Create result object where keys are positions
    const result = {};

    for (const position of positions) {
      const candidates = await Candidate.find({ position }).sort({ name: 1 });
      result[position] = candidates;
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching candidates by position:", error);
    res.status(500).json({ message: "Server error fetching candidates by position" });
  }
};
