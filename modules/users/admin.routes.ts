import express from "express";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { AuthRepository } from "../auth/auth.repository";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { roleMiddleware } from "../../middlewares/role.middleware";

const router = express.Router();

const userRepository = new AuthRepository();
const adminService = new AdminService(userRepository);
const adminController = new AdminController(adminService);

// User Management
router.get("/users",
    authMiddleware,
    roleMiddleware(["admin"]),
    adminController.getAllUsers
);

router.delete("/users/:id",
    authMiddleware,
    roleMiddleware(["admin"]),
    adminController.deleteUser
);

router.patch("/users/:id/unblock",
    authMiddleware,
    roleMiddleware(["admin"]),
    adminController.unblockUser
);

// Provider Management
router.get("/providers",
    authMiddleware,
    roleMiddleware(["admin"]),
    adminController.getProviders
);

router.patch("/providers/:id/status",
    authMiddleware,
    roleMiddleware(["admin"]),
    adminController.updateUserStatus
);

export default router;
