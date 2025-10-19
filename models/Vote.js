import mongoose from "mongoose";

const voteSchema = new mongoose.Schema(
  {
    voterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
    },
    position: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// ✅ Prevent duplicate votes per voter per position
voteSchema.index({ voterId: 1, position: 1 }, { unique: true });

export default mongoose.model("Vote", voteSchema);
