import mongoose, { Schema, model, type Document, type Model, type Types } from "mongoose";

export interface VoteDocument extends Document<Types.ObjectId> {
  voterRegNumber: string;
  candidateId: Types.ObjectId;
  position: string;
}

export type VoteModel = Model<VoteDocument>;

const voteSchema = new Schema<VoteDocument>(
  {
    voterRegNumber: {
      type: String,
      required: [true, "Voter registration number is required"],
      trim: true,
      uppercase: true,
    },
    candidateId: {
      type: Schema.Types.ObjectId,
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

voteSchema.index({ voterRegNumber: 1, candidateId: 1 }, { unique: true });

export const Vote: VoteModel = model<VoteDocument, VoteModel>("Vote", voteSchema);

export default Vote;

