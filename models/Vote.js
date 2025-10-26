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

// ✅ Remove the unique restriction
// This means many voters can vote for same position & candidate freely
// (each voter’s regNumber is independent)
//voteSchema.index({ voterRegNumber: 1, position: 1 }); // no "unique: true"

const Vote = mongoose.model("Vote", voteSchema);
export default Vote;
