import { Request, Response, NextFunction } from "express";
import ProviderProfile from "../models/providerProfile.model";
import { createSuccessResponse } from "../types/response";
import { HttpStatusCode } from "../types/http";
import { BadRequestError, NotFoundError } from "../utils/error";

import User from "../models/user.model";
import ProviderAvailability from "../models/providerAvailability.model";

export class ProviderController {
  
  //Update Profile (Basic Info & Photo)
  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const { bio, name, phone } = req.body;
      const profilePhoto = req.file?.path; 

      let profile = await ProviderProfile.findOne({ userId });

      if (!profile) {
        profile = new ProviderProfile({ userId });
      }

      if (bio) profile.bio = bio;
      if (profilePhoto) profile.profilePhoto = profilePhoto;
      
      profile.onboardingStep = Math.max(profile.onboardingStep, 2);
      
      await profile.save();

      if (name || phone) {
        const userUpdate: any = {};
        if (name) userUpdate.name = name;
        if (phone) userUpdate.phone = phone;
        await User.findByIdAndUpdate(userId, userUpdate);
      }

      res.status(HttpStatusCode.OK).json(createSuccessResponse(profile, "Profile updated successfully"));
    } catch (error: any) {
      next(error);
    }
  };

  // Update Location Details
  updateLocation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const { address, latitude, longitude, serviceRadius } = req.body;

      const profile = await ProviderProfile.findOne({ userId });
      if (!profile) throw new NotFoundError("Profile not found");

      if (address) profile.address = address;
      if (serviceRadius) profile.serviceRadius = Number(serviceRadius);

      if (latitude !== undefined && longitude !== undefined && latitude !== null && longitude !== null && !isNaN(Number(latitude)) && !isNaN(Number(longitude))) {
        profile.location = {
          type: "Point",
          coordinates: [Number(longitude), Number(latitude)]
        };
      }

      profile.onboardingStep = Math.max(profile.onboardingStep, 3);
      
      await profile.save();
      res.status(HttpStatusCode.OK).json(createSuccessResponse(profile, "Location updated successfully"));
    } catch (error: any) {
      next(error);
    }
  };

  //  Update Service Details
  updateServiceDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const { serviceId, hourlyRate } = req.body;

      if (!serviceId || !hourlyRate) {
        throw new BadRequestError("Service ID and Hourly Rate are required");
      }

      const profile = await ProviderProfile.findOne({ userId });
      if (!profile) throw new NotFoundError("Profile not found");

      profile.serviceId = serviceId;
      profile.hourlyRate = hourlyRate;
      profile.onboardingStep = Math.max(profile.onboardingStep, 4);
      
      await profile.save();
      res.status(HttpStatusCode.OK).json(createSuccessResponse(profile, "Service details updated"));
    } catch (error) {
      next(error);
    }
  };

  // Upload Documents
  uploadVerificationDocs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const filesObj = req.files as { [fieldname: string]: Express.Multer.File[] };

      if (!filesObj || Object.keys(filesObj).length === 0) {
        throw new BadRequestError("No documents uploaded");
      }

      const profile = await ProviderProfile.findOne({ userId });
      if (!profile) throw new NotFoundError("Profile not found");

      const newDocs: any[] = [];
      
      if (filesObj.identity) {
        filesObj.identity.forEach(file => {
          newDocs.push({ docType: "identity", url: file.path });
        });
      }

      if (filesObj.license) {
        filesObj.license.forEach(file => {
          newDocs.push({ docType: "license", url: file.path });
        });
      }

      profile.documents = newDocs; // Replace or append? Let's replace for a fresh submission
      profile.onboardingStep = Math.max(profile.onboardingStep, 5);
      profile.onboardingStatus = "in_review";

      await profile.save();
      res.status(HttpStatusCode.OK).json(createSuccessResponse(profile, "Documents uploaded and submitted for review"));
    } catch (error) {
      next(error);
    }
  };

  //Update Bank Details
  updateBankDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const { accountHolderName, bankName, accountNumber, routingNumber } = req.body;

      if (!accountHolderName || !bankName || !accountNumber || !routingNumber) {
        throw new BadRequestError("All bank details are required");
      }

      const profile = await ProviderProfile.findOne({ userId });
      if (!profile) throw new NotFoundError("Profile not found");

      profile.bankDetails = {
        accountHolderName,
        bankName,
        accountNumber,
        routingNumber
      };
      
      profile.onboardingStep = 5;
      profile.onboardingStatus = "in_review"; 

      await profile.save();

      await User.findByIdAndUpdate(userId, { status: "in_review" });

      res.status(HttpStatusCode.OK).json(createSuccessResponse(profile, "Bank details updated and onboarding completed"));
    } catch (error) {
      next(error);
    }
  };

  // Reset profile for re-apply after rejection
  resetForReapply = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;

      const profile = await ProviderProfile.findOne({ userId });
      if (!profile) throw new NotFoundError("Profile not found");

      if (profile.onboardingStatus !== "rejected") {
        throw new BadRequestError("Only rejected profiles can re-apply");
      }

      profile.onboardingStatus = "pending";
      profile.onboardingStep = 1;
      profile.rejectionReason = "";

      await profile.save();

      // Also reset the User model status back to pending
      await User.findByIdAndUpdate(userId, { status: "pending" });

      res.status(HttpStatusCode.OK).json(createSuccessResponse(profile, "Profile reset. You may now re-apply."));
    } catch (error) {
      next(error);
    }
  };

  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const profile = await ProviderProfile.findOne({ userId })
        .populate("userId", "name email phone role status")
        .populate("serviceId", "name description");
      if (!profile) {
        return res.status(HttpStatusCode.OK).json(createSuccessResponse(null));
      }
      res.status(HttpStatusCode.OK).json(createSuccessResponse(profile));
    } catch (error) {
      next(error);
    }
  };

  getAvailability = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const profile = await ProviderProfile.findOne({ userId });
      if (!profile) throw new NotFoundError("Provider profile not found");

      let availability = await ProviderAvailability.findOne({ providerId: profile._id });
      if (!availability) {
        availability = await ProviderAvailability.create({ providerId: profile._id });
      }

      res.status(HttpStatusCode.OK).json(createSuccessResponse(availability));
    } catch (error) {
      next(error);
    }
  };

  updateAvailability = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const data = req.body;
      
      const profile = await ProviderProfile.findOne({ userId });
      if (!profile) throw new NotFoundError("Provider profile not found");

      const availability = await ProviderAvailability.findOneAndUpdate(
        { providerId: profile._id },
        { $set: data },
        { new: true, upsert: true }
      );

      res.status(HttpStatusCode.OK).json(createSuccessResponse(availability, "Availability updated successfully"));
    } catch (error) {
      next(error);
    }
  };
}
