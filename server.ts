import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "./config/db";
import app from "./app";
import { logger } from "./utils/logger";


connectDB();

const PORT = Number(process.env.PORT) || 5000;


app.listen(PORT, () => {
  logger.info(`✅ Server is running on http://localhost:${PORT}`);
});


process.on("unhandledRejection", (err: any) => {
  logger.error("UNHANDLED REJECTION!  Shutting down...", err);
  process.exit(1);
});