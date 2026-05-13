import multer from "multer";
import { profileStorage, documentStorage } from "../config/cloudinary.config";

export const uploadProfile = multer({ storage: profileStorage });
export const uploadDocuments = multer({ storage: documentStorage });
