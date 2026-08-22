import { Router } from "express";
import { serviceService } from "../di/container";
import { ServiceController } from "../controllers/service.controller";
import { ROUTES } from "../constants/routes";

const router = Router();
const serviceController = new ServiceController(serviceService);

router.get(ROUTES.PROVIDERS.LIST, serviceController.getApprovedProviders);

export default router;