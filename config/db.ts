import mongoose from "mongoose"
import { logger } from "../utils/logger";

export const connectDB = async (): Promise<void> => {
  try {
    const uri = process.env.MONGO_URI

    if (!uri) {
      throw new Error("MONGO_URI is missing in .env")
    }

    await mongoose.connect(uri)

    logger.info("MongoDB Connected Successfully");
  } catch (error) {
    logger.error("MongoDB Connection Error:", error);
    process.exit(1)
  }
}