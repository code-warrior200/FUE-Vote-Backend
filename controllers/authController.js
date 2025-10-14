import jwt from "jsonwebtoken";
import User from "../models/User.js";

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// @desc    Login or auto-register by regnumber (department-aware, admin requires password)
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { regnumber, password } = req.body;

    // ✅ Validate registration number format
    const regPattern = /^EZ\/[A-Z]+[0-9]*\/\d{4}$/;
    if (!regPattern.test(regnumber)) {
      return res.status(400).json({
        message:
          "Invalid regnumber format. Use EZ/DEPTnumber/year (e.g., EZ/CSC1234/2025) or EZ/ADMIN/2025",
      });
    }

    const upperReg = regnumber.toUpperCase();

    let role = "voter";
    let department = null;

    // ✅ Detect admin
    if (upperReg.includes("ADMIN")) {
      role = "admin";
    } else {
      // ✅ Extract department (letters between EZ/ and first number)
      const deptMatch = upperReg.match(/^EZ\/([A-Z]+)\d+/);
      if (deptMatch) {
        department = deptMatch[1];
      }
    }

    // ✅ Find user or create new one
    let user = await User.findOne({ regnumber });

    if (!user) {
      // Auto-register new user
      user = await User.create({
        regnumber,
        email: `${upperReg.replace(/\//g, "_")}@auto.${role}`,
        password: role === "admin" ? "admin123" : regnumber, // default admin password
        role,
        department,
      });
    }

    // ✅ If admin, require password
    if (role === "admin") {
      if (!password) {
        return res.status(400).json({ message: "Admin password is required" });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid admin password" });
      }
    }

    // ✅ For voters, no password check
    if (role === "voter") {
      // Update department if format changed
      if (user.department !== department) {
        user.department = department;
        await user.save();
      }
    }

    // ✅ Return success with token
    res.status(200).json({
      _id: user._id,
      regnumber: user.regnumber,
      email: user.email,
      role: user.role,
      department: user.department,
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
