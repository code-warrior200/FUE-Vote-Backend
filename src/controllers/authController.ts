import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User, { type UserDocument } from "../models/User";
import { asyncHandler } from "../middleware/asyncHandler";
import { voters } from "./adminController";

const SECRET_KEY = process.env.JWT_SECRET || "fallback_secret_key";
const TOKEN_EXPIRY = "7d";

interface TokenPayload {
  id?: string;
  regnumber: string;
  username?: string;
  role?: string;
  isDemo?: boolean;
}

const generateToken = ({ id, regnumber, username, role, isDemo }: TokenPayload) =>
  jwt.sign(
    { id, regnumber, username, role: role ?? "voter", isDemo },
    SECRET_KEY,
    { expiresIn: TOKEN_EXPIRY }
  );

const formatUser = (user: UserDocument) => ({
  _id: user._id,
  regnumber: user.regnumber,
  role: user.role,
  name: user.name,
});

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { regnumber, password } = req.body as { regnumber?: string; password?: string };

  if (!regnumber || !password) {
    return res.status(400).json({ message: "Reg number and password required" });
  }

  const user = await User.findOne({ regnumber });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = generateToken({
    id: user._id.toString(),
    regnumber: user.regnumber,
    role: user.role,
  });

  res.status(200).json({
    success: true,
    message: "Login successful",
    token,
    user: formatUser(user),
  });
});

export const loginVoter = asyncHandler(async (req: Request, res: Response) => {
  const { regnumber } = req.body as { regnumber?: string };

  if (!regnumber) {
    return res.status(400).json({ message: "Registration number is required" });
  }

  const regPattern = /^EZ\/[A-Z]{3}\d{4}\/2025$/i;
  if (!regPattern.test(regnumber)) {
    return res.status(401).json({ message: "Invalid registration number format" });
  }

  const normalized = regnumber.toUpperCase();
  const defaultVoters = voters.map((voter) => voter.regnumber.toUpperCase());
  const index = defaultVoters.indexOf(normalized);

  if (index === -1) {
    return res.status(401).json({ message: "Registration number not found" });
  }

  const voterPayload: TokenPayload = {
    id: String(index + 1),
    regnumber: normalized,
    role: "voter",
    isDemo: true,
  };

  const token = generateToken(voterPayload);

  return res.status(200).json({
    success: true,
    message: "Login successful",
    token,
    voter: {
      id: voterPayload.id,
      regnumber: voterPayload.regnumber,
      role: "voter",
    },
  });
});

export const loginAdmin = asyncHandler(async (req: Request, res: Response) => {
  const { username, password } = req.body as { username?: string; password?: string };

  const defaultAdmin = {
    username: "admin",
    password: "admin123",
    role: "admin" as const,
    id: "0",
    regnumber: "ADMIN",
  };

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  if (username !== defaultAdmin.username || password !== defaultAdmin.password) {
    return res.status(401).json({ message: "Invalid admin credentials" });
  }

  const token = generateToken(defaultAdmin);

  res.status(200).json({
    success: true,
    message: "Admin login successful",
    token,
    admin: { username, role: "admin" },
  });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const oldToken = req.headers.authorization?.split(" ")[1];
  if (!oldToken) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(oldToken, SECRET_KEY) as TokenPayload;
    const newToken = generateToken({
      id: decoded.id,
      regnumber: decoded.regnumber,
      username: decoded.username,
      role: decoded.role,
      isDemo: decoded.isDemo,
    });

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      token: newToken,
    });
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
});

