import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import authRoutes from "./modules/auth/auth.routes";
import adminRoutes from "./modules/users/admin.routes";
import { globalErrorHandler } from "./middlewares/error.middleware";
import { logger } from "./utils/logger";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});

app.use(express.json());

app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});


app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);


app.use(globalErrorHandler);

export default app;