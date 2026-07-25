import express from "express";
import { ServiceController } from "../controllers/service.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { ServiceService } from "../services/service.service";
import { ServiceRepository } from "../repositories/service.repository";
import { AuthRepository } from "../repositories/auth.repository";
import { ProviderProfileRepository } from "../repositories/providerProfile.repository";

const router = express.Router();

const serviceRepository = new ServiceRepository();
const userRepository = new AuthRepository();
const providerProfileRepository = new ProviderProfileRepository();

const serviceService = new ServiceService(
  serviceRepository,
  userRepository,
  providerProfileRepository
);

const serviceController = new ServiceController(serviceService);

router.get("/", serviceController.getApprovedProviders);

export default router;
