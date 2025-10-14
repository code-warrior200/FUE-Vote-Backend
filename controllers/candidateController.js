import Candidate from "../models/Candidate.js";
import Category from "../models/Category.js";

export const getAllCandidates = async (req, res) => {
  try {
    const categories = await Category.find();
    const result = {};

    for (let category of categories) {
      const candidates = await Candidate.find({ categoryId: category._id });
      result[category.name] = candidates;
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
