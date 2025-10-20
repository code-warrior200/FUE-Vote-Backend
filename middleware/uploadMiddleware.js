import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

/** ✅ Cloudinary storage configuration */
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "vote_upload", // Cloudinary folder name
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 500, height: 500, crop: "fill" }],
  },
});

/** ✅ Multer upload middleware */
export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Optional: limit files to 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extName = allowedTypes.test(file.originalname.toLowerCase());
    const mimeType = allowedTypes.test(file.mimetype);

    if (extName && mimeType) return cb(null, true);

    cb(new Error("Only images (jpg, jpeg, png, webp) are allowed"));
  },
});
