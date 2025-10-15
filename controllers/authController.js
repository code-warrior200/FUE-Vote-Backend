import jwt from "jsonwebtoken";
import User from "../models/User.js";

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// 🧾 Login (voters auto-login, admin requires password)
export const loginUser = async (req, res) => {
  try {
    const { regnumber, password } = req.body;

    if (!regnumber) {
      return res.status(400).json({ message: "Regnumber is required" });
    }

    // ✅ Normalize regnumber format
    const upperReg = regnumber.toUpperCase().trim();

    // ✅ Match pattern (example: EZ/CSC123/2024)
    const regPattern = /^EZ\/[A-Z]+[0-9]*\/\d{4}$/;
    if (!regPattern.test(upperReg)) {
      return res.status(400).json({
        message:
          "Invalid regnumber format. Use EZ/DEPTnumber/year (e.g., EZ/CSC123/2024)",
      });
    }

    // ✅ Determine user role
    let role = "voter";
    let department = null;

    if (upperReg.includes("ADMIN")) {
      role = "admin";
    } else {
      const deptMatch = upperReg.match(/^EZ\/([A-Z]+)/);
      if (deptMatch) department = deptMatch[1];
    }

    // ✅ Check if user already exists
    let user = await User.findOne({ regnumber: upperReg });

    // ✅ If user doesn't exist, auto-register voter
    if (!user) {
      user = await User.create({
        regnumber: upperReg,
        email: `${upperReg.replace(/\//g, "_")}@auto.${role}`,
        password: role === "admin" ? "admin123" : upperReg, // dummy password for voters
        role,
        department,
      });
    }

    // ✅ Admins must enter password manually
    if (role === "admin") {
      if (!password) {
        return res.status(400).json({ message: "Admin password is required" });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid admin password" });
      }
    }

    // ✅ Generate JWT token
    const token = generateToken(user._id, user.role);
    user.activeToken = token;
    await user.save();

    // ✅ Send success response
    return res.status(200).json({
      _id: user._id,
      regnumber: user.regnumber,
      email: user.email,
      role: user.role,
      department: user.department,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error, please try again later." });
  }
};
