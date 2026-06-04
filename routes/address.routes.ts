import express from "express";
import { AddressController } from "../controllers/address.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = express.Router();
const addressController = new AddressController();

router.use(authMiddleware);

router.get("/", addressController.getAddresses);
router.post("/", addressController.createAddress);
router.patch("/:id", addressController.updateAddress);
router.delete("/:id", addressController.deleteAddress);
router.patch("/:id/default", addressController.setDefaultAddress);

export default router;
