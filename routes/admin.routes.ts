import express from "express";
import { AdminController } from "../controllers/admin.controller";
import { AdminService } from "../services/admin.service";
import { AuthRepository } from "../repositories/auth.repository";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";

import { validate } from "../middlewares/validate.middleware";
import { IdParamSchema, UpdateStatusSchema, UserQuerySchema } from "../dtos/admin.dto";
import { ROUTES } from "../constants/routes";

const router = express.Router();

const userRepository = new AuthRepository();
const adminService = new AdminService(userRepository);
const adminController = new AdminController(adminService);

router.get(ROUTES.ADMIN.USERS,
    authMiddleware,
    roleMiddleware(["admin"]),
    validate(UserQuerySchema),
    adminController.getAllUsers
);

router.delete(ROUTES.ADMIN.USER_BY_ID,
    authMiddleware,
    roleMiddleware(["admin"]),
    validate(IdParamSchema),
    adminController.deleteUser
);

router.patch(ROUTES.ADMIN.UNBLOCK_USER,
    authMiddleware,
    roleMiddleware(["admin"]),
    validate(IdParamSchema),
    adminController.unblockUser
);

router.get(ROUTES.ADMIN.PROVIDERS,
    authMiddleware,
    roleMiddleware(["admin"]),
    validate(UserQuerySchema),
    adminController.getProviders
);

router.get(ROUTES.ADMIN.PROVIDER_BY_ID,
    authMiddleware,
    roleMiddleware(["admin"]),
    adminController.getProviderDetail
);

router.post(ROUTES.ADMIN.VERIFY_PROVIDER,
    authMiddleware,
    roleMiddleware(["admin"]),
    adminController.verifyProvider
);

router.patch(ROUTES.ADMIN.PROVIDER_STATUS,
    authMiddleware,
    roleMiddleware(["admin"]),
    validate(UpdateStatusSchema),
    adminController.updateUserStatus
);

router.get(ROUTES.ADMIN.SERVICES,
    authMiddleware,
    roleMiddleware(["admin"]),
    adminController.getAllServices
);

router.post(ROUTES.ADMIN.SERVICES,
    authMiddleware,
    roleMiddleware(["admin"]),
    adminController.addService
);

router.delete(ROUTES.ADMIN.SERVICE_BY_ID,
    authMiddleware,
    roleMiddleware(["admin"]),
    validate(IdParamSchema),
    adminController.deleteService
);

router.get(ROUTES.ADMIN.DASHBOARD,
    authMiddleware,
    roleMiddleware(["admin"]),
    adminController.getDashboardStats
);

router.get(ROUTES.ADMIN.BOOKINGS,
    authMiddleware,
    roleMiddleware(["admin"]),
    adminController.getAllBookings
);

router.get(ROUTES.ADMIN.BOOKING_BY_ID,
    authMiddleware,
    roleMiddleware(["admin"]),
    adminController.getBookingById
);

export default router;
