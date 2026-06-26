import express from "express";
import { AddressController } from "../controllers/address.controller";
import { AddressService } from "../services/address.service";
import { AddressRepository } from "../repositories/address.repository";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { CreateAddressSchema, UpdateAddressSchema } from "../dtos/address.dto";
import { ROUTES } from "../constants/routes";

const router = express.Router();

const addressRepository = new AddressRepository();
const addressService = new AddressService(addressRepository);
const addressController = new AddressController(addressService);

router.use(authMiddleware);

router.get(ROUTES.ADDRESS.LIST, addressController.getAddresses);
router.post(ROUTES.ADDRESS.CREATE, validate(CreateAddressSchema), addressController.createAddress);
router.patch(ROUTES.ADDRESS.UPDATE, validate(UpdateAddressSchema), addressController.updateAddress);
router.delete(ROUTES.ADDRESS.DELETE, addressController.deleteAddress);
router.patch(ROUTES.ADDRESS.SET_DEFAULT, addressController.setDefaultAddress);

export default router;