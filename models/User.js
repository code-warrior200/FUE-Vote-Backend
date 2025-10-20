import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    regnumber: {
      type: String,
      required: [true, "Registration number is required"],
      unique: true,
      trim: true,
      uppercase: true, // normalize casing
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6, // optional: enforce minimum password length
    },
    role: {
      type: String,
      enum: ["admin", "voter"],
      default: "voter",
    },
    activeToken: {
      type: String, // store currently active login token
      default: null,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

// 🔒 Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 🔑 Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
