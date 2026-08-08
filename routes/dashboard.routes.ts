import { Router } from "express";
import { dashboardService } from "../di/container"; 
import { DashboardController } from "../controllers/dashboard.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";

const router = Router();
const dashboardController = new DashboardController(dashboardService);

router.use(authMiddleware);

router.get("/user", roleMiddleware("user"), dashboardController.getUserDashboard);
router.get("/provider", roleMiddleware("provider"), dashboardController.getProviderDashboard);

export default router;