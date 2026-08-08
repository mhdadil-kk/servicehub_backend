import { Router } from "express";
import { adminService } from "../di/container";
import { AdminController } from "../controllers/admin.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";


const router = Router();
const adminController = new AdminController(adminService);

router.use(authMiddleware, roleMiddleware("admin"));

router.get("/users", adminController.getAllUsers);
router.get("/providers", adminController.getProviders);
router.patch("/users/:id/status", adminController.updateUserStatus);
router.patch("/users/:id/unblock", adminController.unblockUser);
router.delete("/users/:id", adminController.deleteUser);

router.post("/services", adminController.addService);
router.get("/services", adminController.getAllServices);
router.delete("/services/:id", adminController.deleteService);

router.get("/providers/pending", adminController.getPendingProviders);
router.get("/providers/:id", adminController.getProviderDetail);
router.patch("/providers/:providerId/verification", adminController.updateProviderVerification);

router.get("/dashboard/stats", adminController.getAdminStats);
router.get("/dashboard/revenue", adminController.getAdminRevenue);
router.get("/dashboard/user-growth", adminController.getUserGrowth);

router.get("/reports", adminController.getAllReports);
router.post("/reports/:reportId/resolve", adminController.resolveReport);

export default router;
