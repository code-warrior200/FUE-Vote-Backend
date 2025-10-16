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
    const summary = [];

    for (const category of categories) {
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

      summary.push({
        category: category.name,
        totalCandidates: candidates.length,
        results,
      });
    }

    res.status(200).json({
      totalCategories: categories.length,
      summary,
    });
  } catch (error) {
    console.error("Error fetching vote summary:", error);
    res.status(500).json({ message: "Failed to get vote summary", error: error.message });
  }
};

/**
 * @desc    Add a new candidate
 * @route   POST /api/admin/add-candidate
 * @access  Admin only
 */
export const addCandidate = async (req, res) => {
  try {
    const { name, department, categoryId, image } = req.body;

    // Validation
    if (!name || !department || !categoryId) {
      return res.status(400).json({ message: "Please provide name, department, and categoryId." });
    }

    // Ensure category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found." });
    }

    // Check if candidate already exists in this category
    const existingCandidate = await Candidate.findOne({ name, categoryId });
    if (existingCandidate) {
      return res.status(400).json({ message: "Candidate already exists in this category." });
    }

    // Create new candidate
    const newCandidate = new Candidate({
      name,
      department,
      categoryId,
      image: image || null, // Optional
    });

    await newCandidate.save();

    res.status(201).json({
      message: "Candidate added successfully.",
      candidate: newCandidate,
    });
  } catch (error) {
    console.error("Error adding candidate:", error);
    res.status(500).json({ message: "Failed to add candidate", error: error.message });
  }
};
