import Address from "../models/address.model";
import { IAddress } from "../types/address.types";
import { NotFoundError } from "../utils/error";

export class AddressService {
  async getAddresses(userId: string): Promise<IAddress[]> {
    return await Address.find({ userId }).sort({ isDefault: -1, createdAt: -1 });
  }

  async createAddress(userId: string, data: any): Promise<IAddress> {
    const addressCount = await Address.countDocuments({ userId });
    
    // If it's the first address, it should default to true
    let isDefault = data.isDefault || false;
    if (addressCount === 0) {
      isDefault = true;
    }

    if (isDefault) {
      // Set all other addresses for this user to isDefault = false
      await Address.updateMany({ userId }, { $set: { isDefault: false } });
    }

    const address = new Address({
      userId,
      label: data.label,
      fullAddress: data.fullAddress,
      latitude: data.latitude,
      longitude: data.longitude,
      isDefault
    });

    return await address.save();
  }

  async updateAddress(userId: string, addressId: string, data: any): Promise<IAddress> {
    const address = await Address.findOne({ _id: addressId, userId });
    if (!address) {
      throw new NotFoundError("Address not found");
    }

    if (data.label) address.label = data.label;
    if (data.fullAddress) address.fullAddress = data.fullAddress;
    if (data.latitude !== undefined) address.latitude = data.latitude;
    if (data.longitude !== undefined) address.longitude = data.longitude;

    if (data.isDefault !== undefined && data.isDefault !== address.isDefault) {
      if (data.isDefault) {
        await Address.updateMany({ userId }, { $set: { isDefault: false } });
        address.isDefault = true;
      } else {
        // If they are trying to unset the default, check if they have other addresses
        const otherAddresses = await Address.findOne({ userId, _id: { $ne: addressId } });
        if (otherAddresses) {
          address.isDefault = false;
          // Set another address as default
          otherAddresses.isDefault = true;
          await otherAddresses.save();
        } else {
          // If it's the only address, it must remain default
          address.isDefault = true;
        }
      }
    }

    return await address.save();
  }

  async deleteAddress(userId: string, addressId: string): Promise<void> {
    const address = await Address.findOne({ _id: addressId, userId });
    if (!address) {
      throw new NotFoundError("Address not found");
    }

    const wasDefault = address.isDefault;
    await Address.deleteOne({ _id: addressId, userId });

    if (wasDefault) {
      // Find another address to set as default
      const remainingAddress = await Address.findOne({ userId });
      if (remainingAddress) {
        remainingAddress.isDefault = true;
        await remainingAddress.save();
      }
    }
  }

  async setDefaultAddress(userId: string, addressId: string): Promise<IAddress> {
    const address = await Address.findOne({ _id: addressId, userId });
    if (!address) {
      throw new NotFoundError("Address not found");
    }

    await Address.updateMany({ userId }, { $set: { isDefault: false } });
    address.isDefault = true;
    return await address.save();
  }
}
