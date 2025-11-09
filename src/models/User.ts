import bcrypt from "bcryptjs";
import { Schema, model, type Document, type Model, type Types } from "mongoose";

export interface UserDocument extends Document<Types.ObjectId> {
  regnumber: string;
  password: string;
  role: "admin" | "voter";
  name?: string;
  activeToken?: string | null;
  comparePassword(candidate: string): Promise<boolean>;
}

export type UserModel = Model<UserDocument>;

const userSchema = new Schema<UserDocument>(
  {
    regnumber: {
      type: String,
      required: [true, "Registration number is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["admin", "voter"],
      default: "voter",
    },
    activeToken: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre<UserDocument>("save", async function hashPassword(next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function comparePassword(this: UserDocument, candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

export const User: UserModel = model<UserDocument, UserModel>("User", userSchema);

export default User;

