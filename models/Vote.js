import mongoose from "mongoose";

const voteSchema = new mongoose.Schema(
  {
    voterRegNumber: {
      type: String,
      required: [true, "Voter registration number is required"],
      trim: true,
      uppercase: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: [true, "Candidate ID is required"],
    },
    position: {
      type: String,
      required: [true, "Position is required"],
      trim: true,
    },
  },
  { timestamps: true }
);

// ✅ REMOVE UNIQUE RESTRICTION — allow multiple voters per position
// ❌ Do NOT include `unique: true` in your index
// voteSchema.index({ voterRegNumber: 1, position: 1 }); // optional (non-unique)

const Vote = mongoose.model("Vote", voteSchema);
export default Vote;
