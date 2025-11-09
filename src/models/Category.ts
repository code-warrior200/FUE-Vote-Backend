import { Schema, model, type Document, type Model, type Types } from "mongoose";

export interface CategoryDocument extends Document<Types.ObjectId> {
  name: string;
  startDate?: Date;
  endDate?: Date;
}

export type CategoryModel = Model<CategoryDocument>;

const categorySchema = new Schema<CategoryDocument>(
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

categorySchema.index({ name: 1 });

export const Category: CategoryModel = model<CategoryDocument, CategoryModel>("Category", categorySchema);

export default Category;

