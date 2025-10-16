import mongoose from "mongoose";

const candidateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  position: {
    type: String,
    required: true,
  },
  image: {
    type: String, // optional (e.g., URL or filename)
    default: "",
  },
  votes: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

const Candidate = mongoose.model("Candidate", candidateSchema);
export default Candidate;
