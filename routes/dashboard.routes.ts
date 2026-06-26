import { Router } from "express";
import { DashboardController } from "../controllers/dashboard.controller";
import { DashboardService } from "../services/dashboard.service";
import { BookingRepository } from "../repositories/booking.repository";
import { TransactionRepository } from "../repositories/transaction.repository";
import { ProviderProfileRepository } from "../repositories/providerProfile.repository";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { ROUTES } from "../constants/routes";

const router = Router();

const bookingRepository = new BookingRepository();
const transactionRepository = new TransactionRepository();
const providerProfileRepository = new ProviderProfileRepository();
const dashboardService = new DashboardService(
  bookingRepository,
  transactionRepository,
  providerProfileRepository
);
const dashboardController = new DashboardController(dashboardService);

router.get(
  ROUTES.DASHBOARD.USER,
  authMiddleware,
  roleMiddleware(["user"]),
  dashboardController.getUserDashboard
);

router.get(
  ROUTES.DASHBOARD.PROVIDER,
  authMiddleware,
  roleMiddleware(["provider"]),
  dashboardController.getProviderDashboard
);

export default router;