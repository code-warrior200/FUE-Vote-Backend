import mongoose from "mongoose";

const voteSchema = new mongoose.Schema({
  voterId: { type: String, required: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate" },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model("Vote", voteSchema);
