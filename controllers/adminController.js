import Category from "../models/Category.js";
import Candidate from "../models/Candidate.js";
import Vote from "../models/Vote.js";

/**
 * @desc    Get a summary of all votes grouped by category
 * @route   GET /api/admin/vote-summary
 * @access  Admin only
 */
export const getVoteSummary = async (req, res) => {
  try {
    const categories = await Category.find();

    const summary = await Promise.all(
      categories.map(async (category) => {
        const candidates = await Candidate.find({ categoryId: category._id });

        const results = await Promise.all(
          candidates.map(async (cand) => {
            const voteCount = await Vote.countDocuments({ candidateId: cand._id });
            return {
              candidateName: cand.name,
              department: cand.department,
              totalVotes: voteCount,
            };
          })
        );

        return {
          category: category.name,
          totalCandidates: candidates.length,
          results,
        };
      })
    );

    return res.status(200).json({
      totalCategories: categories.length,
      summary,
    });
  } catch (error) {
    console.error("Error fetching vote summary:", error);
    return res.status(500).json({
      message: "Failed to get vote summary",
      error: error.message,
    });
  }
};

/**
 * @desc    Add a new candidate
 * @route   POST /api/admin/add-candidate
 * @access  Admin only
 */
export const addCandidate = async (req, res) => {
  try {
    const { name, party, position, department } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : "";

    // Validate required fields
    if (!name || !party || !position || !department) {
      return res.status(400).json({
        message: "All required fields (name, party, position, department) must be provided.",
      });
    }

    // Check if candidate already exists
    const existing = await Candidate.findOne({ name, position });
    if (existing) {
      return res.status(400).json({ message: "Candidate already exists for this position." });
    }

    // Create new candidate
    const candidate = await Candidate.create({
      name,
      party,
      position,
      department,
      image,
    });

    return res.status(201).json({
      message: "Candidate added successfully",
      candidate,
    });
  } catch (error) {
    console.error("Error adding candidate:", error);
    return res.status(500).json({
      message: "Server error while adding candidate",
      error: error.message,
    });
  }
};
