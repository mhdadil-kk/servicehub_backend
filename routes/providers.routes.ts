import { Router } from "express";
import { serviceService } from "../di/container"; 
import { ServiceController } from "../controllers/service.controller";


const router = Router();
const serviceController = new ServiceController(serviceService);

router.get("/", serviceController.getApprovedProviders);

export default router;
