import multer, { FileFilterCallback } from "multer";
import { Request } from "express";
import { profileStorage, documentStorage } from "../config/cloudinary.config";

const profileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (["image/jpeg", "image/jpg", "image/png"].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, JPEG, and PNG images are allowed for profile photos.") as unknown as null, false);
  }
};

const docFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (["image/jpeg", "image/jpg", "image/png", "application/pdf"].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, JPEG, PNG images and PDF documents are allowed."), false);
  }
};

export const uploadProfile = multer({
  storage: profileStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, 
  fileFilter: profileFilter
});

export const uploadDocuments = multer({
  storage: documentStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
  fileFilter: docFilter
});

