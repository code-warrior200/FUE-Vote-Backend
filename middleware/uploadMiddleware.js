import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "vote_upload", // ✅ your Cloudinary folder name
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 500, height: 500, crop: "fill" }],
  },
});

export const upload = multer({ storage });
