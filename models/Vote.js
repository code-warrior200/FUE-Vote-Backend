// models/Vote.js
import mongoose from "mongoose";

const voteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: "Candidate", required: true },
  position: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model("Vote", voteSchema);
