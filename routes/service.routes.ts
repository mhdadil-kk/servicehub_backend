import express from "express";
import { ServiceController } from "../controllers/service.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = express.Router();
const serviceController = new ServiceController();

router.get("/", serviceController.getActiveServices);
router.get("/providers", serviceController.getApprovedProviders);

export default router;
