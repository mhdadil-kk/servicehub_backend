import { Router } from "express";
import { providerService } from "../di/container"; 
import { ProviderController } from "../controllers/provider.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { validate } from "../middlewares/validate.middleware";
import { uploadProfile, uploadDocuments } from "../middlewares/upload.middleware";
import {
  ProfileUpdateSchema,
  LocationUpdateSchema,
  ServiceDetailsSchema,
  BankDetailsSchema,
  UpdateAvailabilitySchema
} from "../dtos/provider.dto";


const router = Router();
const providerController = new ProviderController(providerService);

router.use(authMiddleware, roleMiddleware("provider"));

router.get("/profile", providerController.getProfile);

router.put(
  "/profile",
  uploadProfile.single("profilePhoto"),
  validate(ProfileUpdateSchema),
  providerController.updateProfile
);

router.put(
  "/location",
  validate(LocationUpdateSchema),
  providerController.updateLocation
);

router.put(
  "/service-details",
  validate(ServiceDetailsSchema),
  providerController.updateServiceDetails
);

router.post(
  "/verify-docs",
  uploadDocuments.fields([
    { name: "identity", maxCount: 2 },
    { name: "license", maxCount: 2 }
  ]),
  providerController.uploadVerificationDocs
);

router.put(
  "/bank-details",
  validate(BankDetailsSchema),
  providerController.updateBankDetails
);

router.post("/reapply", providerController.resetForReapply);

router.get("/availability", providerController.getAvailability);
router.put(
  "/availability",
  validate(UpdateAvailabilitySchema),
  providerController.updateAvailability
);

export default router;