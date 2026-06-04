import { Request, Response, NextFunction } from "express";
import { AddressService } from "../services/address.service";
import { createSuccessResponse } from "../types/response";
import { HttpStatusCode } from "../types/http";
import { BadRequestError } from "../utils/error";

export class AddressController {
  private _addressService: AddressService;

  constructor() {
    this._addressService = new AddressService();
  }

  getAddresses = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const addresses = await this._addressService.getAddresses(userId);
      res.status(HttpStatusCode.OK).json(createSuccessResponse(addresses));
    } catch (error) {
      next(error);
    }
  };

  createAddress = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const { label, fullAddress, latitude, longitude, isDefault } = req.body;

      if (!label || !fullAddress) {
        throw new BadRequestError("Label and Full Address are required");
      }

      const address = await this._addressService.createAddress(userId, {
        label,
        fullAddress,
        latitude,
        longitude,
        isDefault
      });

      res.status(HttpStatusCode.CREATED).json(createSuccessResponse(address, "Address added successfully"));
    } catch (error) {
      next(error);
    }
  };

  updateAddress = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { label, fullAddress, latitude, longitude, isDefault } = req.body;

      const address = await this._addressService.updateAddress(userId, id, {
        label,
        fullAddress,
        latitude,
        longitude,
        isDefault
      });

      res.status(HttpStatusCode.OK).json(createSuccessResponse(address, "Address updated successfully"));
    } catch (error) {
      next(error);
    }
  };

  deleteAddress = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      await this._addressService.deleteAddress(userId, id);
      res.status(HttpStatusCode.OK).json(createSuccessResponse(null, "Address deleted successfully"));
    } catch (error) {
      next(error);
    }
  };

  setDefaultAddress = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const address = await this._addressService.setDefaultAddress(userId, id);
      res.status(HttpStatusCode.OK).json(createSuccessResponse(address, "Default address updated"));
    } catch (error) {
      next(error);
    }
  };
}
