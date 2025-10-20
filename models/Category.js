import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
    },
    startDate: Date,
    endDate: Date,
  },
  { timestamps: true }
);

// ✅ Keep this only if you don't want the name to be unique
categorySchema.index({ name: 1 });

export default mongoose.model("Category", categorySchema);
