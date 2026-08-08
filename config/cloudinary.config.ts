import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { env } from "./env";



cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key:    env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

type StorageParams = {
  folder: string;
  allowed_formats: string[];
  access_mode?: string;
  transformation?: object[];
};

function createStorage(params: StorageParams): CloudinaryStorage {
  return new CloudinaryStorage({
    cloudinary,
    params: params as Record<string, unknown>,
  });
}

export const profileStorage = createStorage({
  folder: "servicehub/profiles",
  allowed_formats: ["jpg", "png", "jpeg"],
  transformation: [{ width: 500, height: 500, crop: "limit" }],
});

export const documentStorage = createStorage({
  folder: "servicehub/documents",
  allowed_formats: ["jpg", "png", "jpeg", "pdf"],
  access_mode: "authenticated",
});

export const reportStorage = createStorage({
  folder: "servicehub/reports",
  allowed_formats: ["jpg", "png", "jpeg"],
});

export const chatImageStorage = createStorage({
  folder: "servicehub/chat",
  allowed_formats: ["jpg", "png", "jpeg", "gif", "webp"],
  access_mode: "authenticated",
  transformation: [{ width: 1200, crop: "limit", quality: "auto" }],
});

export default cloudinary;
