import { IAddress } from "../types/address.types";
import { AddressResponseDTO } from "../dtos/address.dto";

export class AddressMapper {
  static toResponse(address: IAddress & { toObject?: () => IAddress }): AddressResponseDTO | null {
    if (!address) return null;

    const a = typeof address.toObject === 'function' ? address.toObject() : address;

    return {
      _id: a._id?.toString() || a.id || "",
      userId: a.userId ? a.userId.toString() : "",
      label: a.label,
      fullAddress: a.fullAddress,
      latitude: a.latitude,
      longitude: a.longitude,
      isDefault: a.isDefault,
      createdAt: new Date(a.createdAt || Date.now()).toISOString(),
      updatedAt: new Date(a.updatedAt || Date.now()).toISOString(),
    };
  }

  static toArrayResponse(addresses: (IAddress & { toObject?: () => IAddress })[]): AddressResponseDTO[] {
    return addresses.map(address => this.toResponse(address)!);
  }
}
