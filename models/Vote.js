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

/* 
✅ RULE:
  - Each voter can vote only once per position.
  - Many voters can vote for the same candidate.
  - No voter can cast two votes for the same position.
*/
voteSchema.index({ voterRegNumber: 1, position: 1 }, { unique: true });

const Vote = mongoose.model("Vote", voteSchema);
export default Vote;
