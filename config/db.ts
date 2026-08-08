import mongoose from "mongoose";
import { logger } from "../utils/logger";
import { env } from "./env";


export const connectDB = async (): Promise<void> => {
  await mongoose.connect(env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });
  logger.info("[DB] ✅ MongoDB connected successfully.");
};