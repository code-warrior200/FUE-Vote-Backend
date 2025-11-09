import type { Request } from "express";
import multer, { type FileFilterCallback } from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import type { UploadApiOptions } from "cloudinary";
import cloudinary from "../config/cloudinary";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (): Promise<UploadApiOptions> => ({
    folder: "vote_upload",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 500, height: 500, crop: "fill" }],
  }),
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extName = allowedTypes.test(file.originalname.toLowerCase());
    const mimeType = allowedTypes.test(file.mimetype);

    if (extName && mimeType) {
      return cb(null, true);
    }

    cb(new Error("Only images (jpg, jpeg, png, webp) are allowed"));
  },
});

