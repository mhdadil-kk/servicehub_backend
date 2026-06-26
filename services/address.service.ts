import { IAddressRepository } from "../interfaces/repositories/IAddressRepository";
import { IAddress } from "../types/address.types";
import { NotFoundError } from "../utils/error";
import { ERROR_MESSAGES } from "../constants/messages";
import { IAddressService, CreateAddressInput, UpdateAddressInput } from "../interfaces/services/IAddressService";

export class AddressService implements IAddressService {
    private _addressRepository: IAddressRepository;
  constructor(
    addressRepository: IAddressRepository
  ) {
    this._addressRepository = addressRepository;
}

  async getAddresses(userId: string): Promise<IAddress[]> {
    return this._addressRepository.findByUserId(userId);
  }

  async createAddress(userId: string, data: CreateAddressInput): Promise<IAddress> {
    const addressCount = await this._addressRepository.countByUserId(userId);
    let isDefault = data.isDefault ?? false;
    if (addressCount === 0) isDefault = true;

    if (isDefault) {
      await this._addressRepository.clearDefaultForUser(userId);
    }

    return this._addressRepository.create({
      userId,
      label: data.label,
      fullAddress: data.fullAddress,
      latitude: data.latitude,
      longitude: data.longitude,
      isDefault,
    } as unknown as Partial<IAddress>);
  }

  async updateAddress(userId: string, addressId: string, data: UpdateAddressInput): Promise<IAddress> {
    const address = await this._addressRepository.findByIdForUser(addressId, userId);
    if (!address) throw new NotFoundError(ERROR_MESSAGES.ADDRESS_NOT_FOUND);

    const updates: Partial<IAddress> = {};
    if (data.label !== undefined) updates.label = data.label;
    if (data.fullAddress !== undefined) updates.fullAddress = data.fullAddress;
    if (data.latitude !== undefined) updates.latitude = data.latitude;
    if (data.longitude !== undefined) updates.longitude = data.longitude;

    if (data.isDefault !== undefined && data.isDefault !== address.isDefault) {
      if (data.isDefault) {
        await this._addressRepository.clearDefaultForUser(userId);
        updates.isDefault = true;
      } else {
        const other = await this._addressRepository.findOtherByUserId(userId, addressId);
        if (other) {
          updates.isDefault = false;
          await this._addressRepository.updateById(other._id.toString(), { isDefault: true });
        } else {
          updates.isDefault = true; 
        }
      }
    }

    const updated = await this._addressRepository.updateById(addressId, updates);
    if (!updated) throw new NotFoundError(ERROR_MESSAGES.ADDRESS_NOT_FOUND);
    return updated;
  }

  async deleteAddress(userId: string, addressId: string): Promise<void> {
    const address = await this._addressRepository.findByIdForUser(addressId, userId);
    if (!address) throw new NotFoundError(ERROR_MESSAGES.ADDRESS_NOT_FOUND);

    const wasDefault = address.isDefault;
    const deleted = await this._addressRepository.deleteByIdForUser(addressId, userId);
    if (!deleted) throw new NotFoundError(ERROR_MESSAGES.ADDRESS_NOT_FOUND);

    if (wasDefault) {
      const remaining = await this._addressRepository.findFirstByUserId(userId);
      if (remaining) {
        await this._addressRepository.updateById(remaining._id.toString(), { isDefault: true });
      }
    }
  }

  async setDefaultAddress(userId: string, addressId: string): Promise<IAddress> {
    const address = await this._addressRepository.findByIdForUser(addressId, userId);
    if (!address) throw new NotFoundError(ERROR_MESSAGES.ADDRESS_NOT_FOUND);

    await this._addressRepository.clearDefaultForUser(userId);
    const updated = await this._addressRepository.updateById(addressId, { isDefault: true });
    if (!updated) throw new NotFoundError(ERROR_MESSAGES.ADDRESS_NOT_FOUND);
    return updated;
  }
}