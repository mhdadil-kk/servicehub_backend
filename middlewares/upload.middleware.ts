import multer from "multer";
import { profileStorage, documentStorage } from "../config/cloudinary.config";

const profileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  if (["image/jpeg", "image/jpg", "image/png"].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, JPEG, and PNG images are allowed for profile photos."), false);
  }
};

const docFilter = (req: any, file: Express.Multer.File, cb: any) => {
  if (["image/jpeg", "image/jpg", "image/png", "application/pdf"].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, JPEG, PNG images and PDF documents are allowed."), false);
  }
};

export const uploadProfile = multer({
  storage: profileStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: profileFilter
});

export const uploadDocuments = multer({
  storage: documentStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: docFilter
});

