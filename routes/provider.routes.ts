import { Router } from "express";
import { providerService } from "../di/container";
import { ProviderController } from "../controllers/provider.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { validate } from "../middlewares/validate.middleware";
import { uploadProfile, uploadDocuments } from "../middlewares/upload.middleware";
import { ROUTES } from "../constants/routes";
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

router.get(ROUTES.PROVIDER.PROFILE, providerController.getProfile);
router.put(ROUTES.PROVIDER.PROFILE, uploadProfile.single("profilePhoto"), validate(ProfileUpdateSchema), providerController.updateProfile);
router.put(ROUTES.PROVIDER.LOCATION, validate(LocationUpdateSchema), providerController.updateLocation);
router.put(ROUTES.PROVIDER.SERVICE_DETAILS, validate(ServiceDetailsSchema), providerController.updateServiceDetails);
router.post(ROUTES.PROVIDER.VERIFY_DOCS, uploadDocuments.fields([
  { name: "identity", maxCount: 2 },
  { name: "license", maxCount: 2 }
]), providerController.uploadVerificationDocs);
router.put(ROUTES.PROVIDER.BANK_DETAILS, validate(BankDetailsSchema), providerController.updateBankDetails);
router.post(ROUTES.PROVIDER.REAPPLY, providerController.resetForReapply);
router.get(ROUTES.PROVIDER.AVAILABILITY, providerController.getAvailability);
router.put(ROUTES.PROVIDER.AVAILABILITY, validate(UpdateAvailabilitySchema), providerController.updateAvailability);

export default router;