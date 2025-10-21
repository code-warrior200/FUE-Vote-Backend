// controllers/candidateController.js
import Candidate from "../models/Candidate.js"; // adjust path to your model if needed

export const getAllCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find(); // or however you're fetching from DB

    if (!candidates || candidates.length === 0) {
      return res.status(404).json([]); // ✅ return an empty array (not an object)
    }

    // ✅ Always return a plain array
    const formatted = candidates.map((c) => ({
      id: c._id,
      name: c.name,
      dept: c.department,
      image: c.photoUrl || c.image || "",
      position: c.position,
      votes: c.votes || 0,
    }));

    return res.status(200).json(formatted);
  } catch (error) {
    console.error("Error fetching candidates:", error);
    res.status(500).json({ message: "Server error fetching candidates" });
  }
};
