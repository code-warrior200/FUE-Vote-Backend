import mongoose from "mongoose";

const voteSchema = new mongoose.Schema(
  {
    voterRegNumber: {
      type: String,
      required: [true, "Voter registration number is required"],
      trim: true,
      uppercase: true,
      unique: true, // ✅ each voter can only vote once total
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

// ✅ ensure voter can only appear once in collection
voteSchema.index({ voterRegNumber: 1 }, { unique: true });

const Vote = mongoose.model("Vote", voteSchema);
export default Vote;
