import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

// Load env
dotenv.config({ path: path.join(__dirname, "../.env") });

const mongoUri = process.env.MONGO_URI;

async function syncStatus() {
  if (!mongoUri) {
    console.error("MONGO_URI not found in .env");
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("Connected successfully.");

    // Define a minimal schema for the update
    const UserSchema = new mongoose.Schema({
      status: String
    });
    const User = mongoose.model("User", UserSchema);

    console.log("Updating users with status 'active' to 'approved'...");
    const result = await User.updateMany(
      { status: "active" },
      { $set: { status: "approved" } }
    );

    console.log(`Update complete. Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  } catch (error) {
    console.error("Error during sync:", error);
    process.exit(1);
  }
}

syncStatus();
