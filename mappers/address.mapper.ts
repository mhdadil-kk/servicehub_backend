import { IAddress } from "../types/address.types";

export interface AddressResponseDTO {
  _id: string;
  userId: string;
  label: string;
  fullAddress: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export class AddressMapper {
  static toResponse(address: IAddress & { toObject?: () => IAddress }): AddressResponseDTO | null {
    if (!address) return null;

    const a = typeof address.toObject === 'function' ? address.toObject() : address;

    return {
      _id: (a as IAddress & { _id?: { toString: () => string }; id?: string })._id?.toString() || (a as IAddress & { id?: string }).id || "",
      userId: a.userId.toString(),
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
