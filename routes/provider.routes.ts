import express from "express";
import { ProviderController } from "../controllers/provider.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { roleMiddleware } from "../middlewares/role.middleware";
import { uploadProfile, uploadDocuments } from "../middlewares/upload.middleware";
import { validate } from "../middlewares/validate.middleware";
import { ProfileUpdateSchema, ServiceDetailsSchema } from "../dtos/provider.dto";

const router = express.Router();
const providerController = new ProviderController();

// All routes require provider role
router.use(authMiddleware, roleMiddleware(["provider"]));

router.get("/profile", providerController.getProfile);

// Availability
router.get("/availability", providerController.getAvailability);
router.put("/availability", providerController.updateAvailability);

// Step 1: Profile Info + Photo
router.patch("/onboarding/profile", 
  uploadProfile.single("profilePhoto"), 
  validate(ProfileUpdateSchema),
  providerController.updateProfile
);

// Step 2: Location Info
router.patch("/onboarding/location", 
  providerController.updateLocation
);

// Step 2: Service Info
router.patch("/onboarding/service", 
  validate(ServiceDetailsSchema),
  providerController.updateServiceDetails
);

// Step 3: Documents
router.post("/onboarding/documents", 
  uploadDocuments.fields([
    { name: "identity", maxCount: 5 },
    { name: "license", maxCount: 5 }
  ]), 
  providerController.uploadVerificationDocs
);

// Reset profile for re-applying
router.post("/onboarding/reset", providerController.resetForReapply);

router.patch("/onboarding/bank", 
  providerController.updateBankDetails
);

export default router;
