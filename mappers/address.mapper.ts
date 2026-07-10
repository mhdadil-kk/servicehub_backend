import { IAddress } from "../models/address.model";

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
  static toResponse(address: IAddress | any): AddressResponseDTO | null {
    if (!address) return null;

    const a = typeof address.toObject === 'function' ? address.toObject() : address;

    return {
      _id: a._id.toString(),
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

  static toArrayResponse(addresses: any[]): AddressResponseDTO[] {
    return addresses.map(address => this.toResponse(address)!);
  }
}
