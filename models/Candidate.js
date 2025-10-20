import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Candidate name is required"],
      trim: true,
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
    },
    position: {
      type: String,
      required: [true, "Position is required"],
      trim: true,
    },
    image: {
      type: String,
      default: "", // optional, can store URL or path
    },
    totalVotes: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true, // createdAt and updatedAt
  }
);

/** Optional: Index for faster queries by position */
candidateSchema.index({ position: 1, name: 1 });

const Candidate = mongoose.model("Candidate", candidateSchema);

export default Candidate;
