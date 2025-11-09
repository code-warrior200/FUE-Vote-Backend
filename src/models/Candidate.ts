import { Schema, model, type Document, type Model, type Types } from "mongoose";

export interface CandidateDocument extends Document<Types.ObjectId> {
  name: string;
  department: string;
  position: string;
  image?: string;
  categoryId?: Types.ObjectId | null;
  totalVotes: number;
  votes?: number;
}

export type CandidateModel = Model<CandidateDocument>;

const candidateSchema = new Schema<CandidateDocument>(
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
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    image: {
      type: String,
      default: "",
    },
    totalVotes: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Candidate: CandidateModel = model<CandidateDocument, CandidateModel>("Candidate", candidateSchema);

export default Candidate;

