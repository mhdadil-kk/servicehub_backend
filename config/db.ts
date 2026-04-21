import mongoose from "mongoose"

export const connectDB = async (): Promise<void> => {
  try {
    const uri = process.env.MONGO_URI   // ✅ direct access

    if (!uri) {
      throw new Error("❌ MONGO_URI is missing in .env")
    }

    await mongoose.connect(uri)

    console.log("✅ MongoDB connected successfully")
  } catch (error) {
    console.log(error, "MongoDB connection failed")
    process.exit(1)
  }
}