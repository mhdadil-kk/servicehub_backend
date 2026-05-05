import express from "express";
import { AdminController } from "../controllers/admin.controller";
import { AdminService } from "../services/admin.service";
import { AuthRepository } from "../repositories/auth.repository";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";

import { validate } from "../middlewares/validate.middleware";
import { IdParamSchema, UpdateStatusSchema, UserQuerySchema } from "../dtos/admin.dto";

const router = express.Router();

const userRepository = new AuthRepository();
const adminService = new AdminService(userRepository);
const adminController = new AdminController(adminService);

// User Management
router.get("/users",
    authMiddleware,
    roleMiddleware(["admin"]),
    validate(UserQuerySchema),
    adminController.getAllUsers
);

router.delete("/users/:id",
    authMiddleware,
    roleMiddleware(["admin"]),
    validate(IdParamSchema),
    adminController.deleteUser
);

router.patch("/users/:id/unblock",
    authMiddleware,
    roleMiddleware(["admin"]),
    validate(IdParamSchema),
    adminController.unblockUser
);

// Provider Management
router.get("/providers",
    authMiddleware,
    roleMiddleware(["admin"]),
    validate(UserQuerySchema),
    adminController.getProviders
);

router.patch("/providers/:id/status",
    authMiddleware,
    roleMiddleware(["admin"]),
    validate(UpdateStatusSchema),
    adminController.updateUserStatus
);


export default router;
