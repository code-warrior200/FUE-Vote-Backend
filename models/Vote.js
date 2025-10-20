import mongoose from "mongoose";

const voteSchema = new mongoose.Schema(
  {
    // ✅ Instead of ObjectId reference, use voter’s regnumber directly
    voterRegNumber: {
      type: String,
      required: true,
      trim: true,
    },

    // Candidate they voted for
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
    },

    // Position of the candidate (President, Treasurer, etc.)
    position: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// ✅ Prevent double voting: One vote per voter per position
voteSchema.index({ voterRegNumber: 1, position: 1 }, { unique: true });

const Vote = mongoose.model("Vote", voteSchema);
export default Vote;
