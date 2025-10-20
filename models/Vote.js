import mongoose from "mongoose";

const voteSchema = new mongoose.Schema(
  {
    // 🔹 Use voter’s registration number directly
    voterRegNumber: {
      type: String,
      required: [true, "Voter registration number is required"],
      trim: true,
      uppercase: true, // normalize casing
    },

    // 🔹 Candidate reference
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: [true, "Candidate ID is required"],
    },

    // 🔹 Candidate's position (e.g., President, Treasurer)
    position: {
      type: String,
      required: [true, "Position is required"],
      trim: true,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

// 🔒 Prevent double voting: One vote per voter per position
voteSchema.index({ voterRegNumber: 1, position: 1 }, { unique: true });

const Vote = mongoose.model("Vote", voteSchema);
export default Vote;
