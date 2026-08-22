import { Router } from "express";
import { adminService } from "../di/container";
import { AdminController } from "../controllers/admin.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { ROUTES } from "../constants/routes";

const router = Router();
const adminController = new AdminController(adminService);

router.use(authMiddleware, roleMiddleware("admin"));

router.get(ROUTES.ADMIN.USERS, adminController.getAllUsers);
router.get(ROUTES.ADMIN.PROVIDERS, adminController.getProviders);
router.patch(ROUTES.ADMIN.USER_STATUS, adminController.updateUserStatus);
router.patch(ROUTES.ADMIN.USER_UNBLOCK, adminController.unblockUser);
router.delete(ROUTES.ADMIN.USER_BY_ID, adminController.deleteUser);

router.post(ROUTES.ADMIN.SERVICES, adminController.addService);
router.get(ROUTES.ADMIN.SERVICES, adminController.getAllServices);
router.delete(ROUTES.ADMIN.SERVICE_BY_ID, adminController.deleteService);

router.get(ROUTES.ADMIN.PROVIDERS_PENDING, adminController.getPendingProviders);
router.get(ROUTES.ADMIN.PROVIDER_BY_ID, adminController.getProviderDetail);
router.patch(ROUTES.ADMIN.PROVIDER_VERIFICATION, adminController.verifyProvider);

router.get(ROUTES.ADMIN.DASHBOARD_STATS, adminController.getDashboardStats);
router.get(ROUTES.ADMIN.DASHBOARD_REVENUE, adminController.getRevenueReport);

router.get(ROUTES.ADMIN.REPORTS, adminController.getAllReports);
router.post(ROUTES.ADMIN.REPORT_RESOLVE, adminController.resolveReport);

router.get(ROUTES.ADMIN.ALL_BOOKINGS, adminController.getAllBookings);
router.get(ROUTES.ADMIN.BOOKING_BY_ID, adminController.getBookingById);

export default router;