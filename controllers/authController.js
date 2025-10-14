import jwt from "jsonwebtoken";
import User from "../models/User.js";

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// @desc    Login user (only allowed regnumber pattern: EZ/number/year)
// @route   POST /api/users/login
// @access  Public (open to all voters)
export const loginUser = async (req, res) => {
  try {
    const { regnumber, password } = req.body;

    // ✅ Validate registration number format (EZ/number/year)
    const regPattern = /^EZ\/\d{1,5}\/\d{4}$/;
    if (!regPattern.test(regnumber)) {
      return res.status(400).json({
        message: "Invalid registration number format. Use EZ/number/year (e.g., EZ/1234/2025)",
      });
    }

    // ✅ Find user by regnumber
    const user = await User.findOne({ regnumber });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid registration number or password" });
    }

    // ✅ Success
    res.json({
      _id: user._id,
      regnumber: user.regnumber,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
