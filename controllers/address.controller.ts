import { Request, Response } from "express";
import { IAddressService } from "../interfaces/services/IAddressService";
import { createSuccessResponse } from "../types/response";
import { HttpStatusCode } from "../types/http";
import { SUCCESS_MESSAGES } from "../constants/messages";
import { AddressMapper } from "../mappers/address.mapper";
import { asyncHandler } from "../utils/async-handler";

export class AddressController {
  constructor(private _addressService: IAddressService) {}

  getAddresses = asyncHandler(async (req: Request, res: Response) => {
    const addresses = await this._addressService.getAddresses(req.user!.id);
    res.status(HttpStatusCode.OK).json(
      createSuccessResponse(AddressMapper.toArrayResponse(addresses), SUCCESS_MESSAGES.ADDRESSES_FETCHED)
    );
  });

  createAddress = asyncHandler(async (req: Request, res: Response) => {
    const address = await this._addressService.createAddress(req.user!.id, req.body);
    res.status(HttpStatusCode.CREATED).json(
      createSuccessResponse(AddressMapper.toResponse(address), SUCCESS_MESSAGES.ADDRESS_CREATED)
    );
  });

  updateAddress = asyncHandler(async (req: Request, res: Response) => {
    const address = await this._addressService.updateAddress(req.user!.id, req.params.id as string, req.body);
    res.status(HttpStatusCode.OK).json(
      createSuccessResponse(AddressMapper.toResponse(address), SUCCESS_MESSAGES.ADDRESS_UPDATED)
    );
  });

  deleteAddress = asyncHandler(async (req: Request, res: Response) => {
    await this._addressService.deleteAddress(req.user!.id, req.params.id as string);
    res.status(HttpStatusCode.OK).json(
      createSuccessResponse(null, SUCCESS_MESSAGES.ADDRESS_DELETED)
    );
  });

  setDefaultAddress = asyncHandler(async (req: Request, res: Response) => {
    const address = await this._addressService.setDefaultAddress(req.user!.id, req.params.id as string);
    res.status(HttpStatusCode.OK).json(
      createSuccessResponse(AddressMapper.toResponse(address), SUCCESS_MESSAGES.ADDRESS_DEFAULT_SET)
    );
  });
}