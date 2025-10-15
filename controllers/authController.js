import jwt from "jsonwebtoken";
import User from "../models/User.js";

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// 🧾 Login (admin requires password, voters auto-login)
export const loginUser = async (req, res) => {
  try {
    const { regnumber, password } = req.body;

    const regPattern = /^EZ\/[A-Z]+[0-9]*\/\d{4}$/;
    if (!regPattern.test(regnumber)) {
      return res.status(400).json({
        message:
          "Invalid regnumber format. Use EZ/DEPTnumber/year or EZ/ADMIN/2025",
      });
    }

    const upperReg = regnumber.toUpperCase();
    let role = "voter";
    let department = null;

    // Determine role
    if (upperReg.includes("ADMIN")) {
      role = "admin";
    } else {
      const deptMatch = upperReg.match(/^EZ\/([A-Z]+)\d+/);
      if (deptMatch) {
        department = deptMatch[1];
      }
    }

    // ✅ Check if user exists
    let user = await User.findOne({ regnumber });

    // ✅ Create user if not exists (auto-login voters)
    if (!user) {
      user = await User.create({
        regnumber,
        email: `${upperReg.replace(/\//g, "_")}@auto.${role}`,
        password: role === "admin" ? "admin123" : regnumber, // voters auto-login
        role,
        department,
      });
    }

    // ✅ Admin password check
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

    res.status(200).json({
      _id: user._id,
      regnumber: user.regnumber,
      email: user.email,
      role: user.role,
      department: user.department,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
