import express from "express";
import { ProviderController } from "../controllers/provider.controller";
import { ProviderService } from "../services/provider.service";
import { ProviderProfileRepository } from "../repositories/providerProfile.repository";
import { ProviderAvailabilityRepository } from "../repositories/providerAvailability.repository";
import { AuthRepository } from "../repositories/auth.repository";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { uploadProfile, uploadDocuments } from "../middlewares/upload.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  ProfileUpdateSchema,
  ServiceDetailsSchema,
  LocationUpdateSchema,
  BankDetailsSchema,
} from "../dtos/provider.dto";
import { ROUTES } from "../constants/routes";

const router = express.Router();

const providerProfileRepository = new ProviderProfileRepository();
const providerAvailabilityRepository = new ProviderAvailabilityRepository();
const userRepository = new AuthRepository();
const providerService = new ProviderService(
  providerProfileRepository,
  providerAvailabilityRepository,
  userRepository
);
const providerController = new ProviderController(providerService);

router.use(authMiddleware, roleMiddleware(["provider"]));

router.get(ROUTES.PROVIDER.PROFILE, providerController.getProfile);
router.get(ROUTES.PROVIDER.AVAILABILITY, providerController.getAvailability);
router.put(ROUTES.PROVIDER.AVAILABILITY, providerController.updateAvailability);

router.patch(
  ROUTES.PROVIDER.ONBOARDING_PROFILE,
  uploadProfile.single("profilePhoto"),
  validate(ProfileUpdateSchema),
  providerController.updateProfile
);
router.patch(
  ROUTES.PROVIDER.ONBOARDING_LOCATION,
  validate(LocationUpdateSchema),
  providerController.updateLocation
);
router.patch(
  ROUTES.PROVIDER.ONBOARDING_SERVICE,
  validate(ServiceDetailsSchema),
  providerController.updateServiceDetails
);
router.post(
  ROUTES.PROVIDER.ONBOARDING_DOCUMENTS,
  uploadDocuments.fields([
    { name: "identity", maxCount: 5 },
    { name: "license", maxCount: 5 },
  ]),
  providerController.uploadVerificationDocs
);
router.post(ROUTES.PROVIDER.ONBOARDING_RESET, providerController.resetForReapply);
router.patch(
  ROUTES.PROVIDER.ONBOARDING_BANK,
  validate(BankDetailsSchema),
  providerController.updateBankDetails
);

export default router;