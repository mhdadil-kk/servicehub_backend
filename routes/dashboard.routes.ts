import { Router } from "express";
import { dashboardService } from "../di/container";
import { DashboardController } from "../controllers/dashboard.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { ROUTES } from "../constants/routes";

const router = Router();
const dashboardController = new DashboardController(dashboardService);

router.use(authMiddleware);

router.get(ROUTES.DASHBOARD.USER, roleMiddleware("user"), dashboardController.getUserDashboard);
router.get(ROUTES.DASHBOARD.PROVIDER, roleMiddleware("provider"), dashboardController.getProviderDashboard);

export default router;