import { Request, Response, NextFunction } from "express";
import { IAddressService } from "../interfaces/services/IAddressService";
import { createSuccessResponse } from "../types/response";
import { HttpStatusCode } from "../types/http";
import { SUCCESS_MESSAGES } from "../constants/messages";

export class AddressController {
  private readonly _addressService: IAddressService;
  constructor(addressService: IAddressService) {
    this._addressService = addressService;
  }

  getAddresses = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const addresses = await this._addressService.getAddresses(req.user!.id);
      res.status(HttpStatusCode.OK).json(
        createSuccessResponse(addresses, SUCCESS_MESSAGES.ADDRESSES_FETCHED)
      );
    } catch (error) {
      next(error);
    }
  };

  createAddress = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const address = await this._addressService.createAddress(req.user!.id, req.body);
      res.status(HttpStatusCode.CREATED).json(
        createSuccessResponse(address, SUCCESS_MESSAGES.ADDRESS_CREATED)
      );
    } catch (error) {
      next(error);
    }
  };

  updateAddress = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const address = await this._addressService.updateAddress(req.user!.id, req.params.id, req.body);
      res.status(HttpStatusCode.OK).json(
        createSuccessResponse(address, SUCCESS_MESSAGES.ADDRESS_UPDATED)
      );
    } catch (error) {
      next(error);
    }
  };

  deleteAddress = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this._addressService.deleteAddress(req.user!.id, req.params.id);
      res.status(HttpStatusCode.OK).json(
        createSuccessResponse(null, SUCCESS_MESSAGES.ADDRESS_DELETED)
      );
    } catch (error) {
      next(error);
    }
  };

  setDefaultAddress = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const address = await this._addressService.setDefaultAddress(req.user!.id, req.params.id);
      res.status(HttpStatusCode.OK).json(
        createSuccessResponse(address, SUCCESS_MESSAGES.ADDRESS_DEFAULT_SET)
      );
    } catch (error) {
      next(error);
    }
  };
}