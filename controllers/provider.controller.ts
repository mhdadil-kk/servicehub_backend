import { Request, Response, NextFunction } from "express";
import ProviderProfile from "../models/providerProfile.model";
import { createSuccessResponse } from "../types/response";
import { HttpStatusCode } from "../types/http";
import { BadRequestError, NotFoundError } from "../utils/error";

import User from "../models/user.model";

export class ProviderController {
  
  //Update Profile (Basic Info & Photo)
  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const { bio, serviceRadius } = req.body;
      const profilePhoto = req.file?.path; 

      console.log("Updating profile for user:", userId);
      console.log("Body data:", { bio, serviceRadius });
      console.log("File data:", profilePhoto);

      let profile = await ProviderProfile.findOne({ userId });

      if (!profile) {
        console.log("Creating new profile for user:", userId);
        profile = new ProviderProfile({ userId });
      }

      if (bio) profile.bio = bio;
      if (serviceRadius) profile.serviceRadius = Number(serviceRadius);
      if (profilePhoto) profile.profilePhoto = profilePhoto;
      
      profile.onboardingStep = Math.max(profile.onboardingStep, 2);
      
      console.log("Saving profile...");
      await profile.save();
      console.log("Profile saved successfully.");

      res.status(HttpStatusCode.OK).json(createSuccessResponse(profile, "Profile updated successfully"));
    } catch (error: any) {
      console.error("Error in updateProfile:", error);
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
      profile.onboardingStep = Math.max(profile.onboardingStep, 3);
      
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
      profile.onboardingStep = Math.max(profile.onboardingStep, 4);
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
      
      profile.onboardingStep = 4;
      profile.onboardingStatus = "in_review"; 

      await profile.save();

      await User.findByIdAndUpdate(userId, { status: "in_review" });

      res.status(HttpStatusCode.OK).json(createSuccessResponse(profile, "Bank details updated and onboarding completed"));
    } catch (error) {
      next(error);
    }
  };

  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const profile = await ProviderProfile.findOne({ userId }).populate("serviceId");
      if (!profile) {
        return res.status(HttpStatusCode.OK).json(createSuccessResponse(null));
      }
      res.status(HttpStatusCode.OK).json(createSuccessResponse(profile));
    } catch (error) {
      next(error);
    }
  };
}
