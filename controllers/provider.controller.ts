import { Request, Response } from "express";
import { IProviderService } from "../interfaces/services/IProviderService";
import { HttpStatusCode } from "../types/http";
import { createSuccessResponse } from "../types/response";
import { SUCCESS_MESSAGES } from "../constants/messages";
import { ProviderProfileMapper } from "../mappers/providerProfile.mapper";
import { ProviderAvailabilityMapper } from "../mappers/providerAvailability.mapper";
import { asyncHandler } from "../utils/async-handler";


export class ProviderController {
  constructor(private _providerService: IProviderService) {}

  updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { bio, name, phone } = req.body;
    const profilePhoto = req.file?.path;

    const profile = await this._providerService.updateProfile(userId, {
      bio,
      name,
      phone,
      profilePhoto,
    });

    res.status(HttpStatusCode.OK).json(
      createSuccessResponse(ProviderProfileMapper.toResponse(profile), SUCCESS_MESSAGES.PROFILE_UPDATED)
    );
  });

  updateLocation = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { address, latitude, longitude, serviceRadius } = req.body;

    const profile = await this._providerService.updateLocation(userId, {
      address,
      latitude: latitude != null ? Number(latitude) : undefined,
      longitude: longitude != null ? Number(longitude) : undefined,
      serviceRadius: serviceRadius != null ? Number(serviceRadius) : undefined,
    });

    res.status(HttpStatusCode.OK).json(
      createSuccessResponse(ProviderProfileMapper.toResponse(profile), SUCCESS_MESSAGES.LOCATION_UPDATED)
    );
  });

  updateServiceDetails = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { serviceId, hourlyRate } = req.body;

    const profile = await this._providerService.updateServiceDetails(userId, {
      serviceId,
      hourlyRate: Number(hourlyRate),
    });

    res.status(HttpStatusCode.OK).json(
      createSuccessResponse(ProviderProfileMapper.toResponse(profile), SUCCESS_MESSAGES.SERVICE_DETAILS_UPDATED)
    );
  });

  uploadVerificationDocs = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const documents: { docType: string; url: string }[] = [];

    if (files?.identity) {
      files.identity.forEach((file) =>
        documents.push({ docType: "identity", url: file.path })
      );
    }

    if (files?.license) {
      files.license.forEach((file) =>
        documents.push({ docType: "license", url: file.path })
      );
    }

    const profile = await this._providerService.uploadVerificationDocs(userId, documents);

    res.status(HttpStatusCode.OK).json(
      createSuccessResponse(ProviderProfileMapper.toResponse(profile), SUCCESS_MESSAGES.DOCUMENTS_UPLOADED)
    );
  });

  updateBankDetails = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const profile = await this._providerService.updateBankDetails(userId, req.body);

    res.status(HttpStatusCode.OK).json(
      createSuccessResponse(ProviderProfileMapper.toResponse(profile), SUCCESS_MESSAGES.BANK_DETAILS_UPDATED)
    );
  });

  resetForReapply = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const profile = await this._providerService.resetForReapply(userId);

    res.status(HttpStatusCode.OK).json(
      createSuccessResponse(ProviderProfileMapper.toResponse(profile), SUCCESS_MESSAGES.PROFILE_RESET)
    );
  });

  getProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const profile = await this._providerService.getProfile(userId);

    res.status(HttpStatusCode.OK).json(
      createSuccessResponse(ProviderProfileMapper.toResponse(profile), SUCCESS_MESSAGES.PROFILE_FETCHED)
    );
  });

  getAvailability = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const availability = await this._providerService.getAvailability(userId);

    res.status(HttpStatusCode.OK).json(
      createSuccessResponse(ProviderAvailabilityMapper.toResponse(availability), SUCCESS_MESSAGES.AVAILABILITY_FETCHED)
    );
  });

  updateAvailability = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const availability = await this._providerService.updateAvailability(userId, req.body);

    res.status(HttpStatusCode.OK).json(
      createSuccessResponse(ProviderAvailabilityMapper.toResponse(availability), SUCCESS_MESSAGES.AVAILABILITY_UPDATED)
    );
  });
}
