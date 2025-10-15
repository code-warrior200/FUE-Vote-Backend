import jwt from "jsonwebtoken";
import User from "../models/User.js";

const generateToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });

export const loginUser = async (req, res) => {
  try {
    const { regnumber, password } = req.body;

    if (!regnumber) {
      return res.status(400).json({ message: "Regnumber is required" });
    }

    const upperReg = regnumber.toUpperCase().trim();
    const regPattern = /^EZ\/[A-Z]+[0-9]*\/\d{4}$/;
    if (!regPattern.test(upperReg)) {
      return res
        .status(400)
        .json({ message: "Invalid format (e.g., EZ/CSC123/2025)" });
    }

    let role = upperReg.includes("ADMIN") ? "admin" : "voter";
    let department = null;
    const match = upperReg.match(/^EZ\/([A-Z]+)/);
    if (match && !username.includes("ADMIN")) department = match[1];

    // find user
    let user = await User.findOne({ regnumber: upperReg });

    // auto-create if missing
    if (!user) {
      user = await User.create({
        username: username,
        password: role === "admin" ? "admin123" : username, // default password
        role,
        department,
      });
    }

    // admin must use password
    if (role === "admin") {
      if (!password) {
        return res.status(400).json({ message: "Admin password required" });
      }
      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid admin password" });
      }
    }

    // generate token
    const token = generateToken(user._id, user.role);
    user.activeToken = token;
    await user.save();

    res.status(200).json({
      _id: user._id,
      regnumber: user.regnumber,
      username: user.username,
      role: user.role,
      department: user.department,
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
