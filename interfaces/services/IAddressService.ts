import { IAddress } from "../../types/address.types";

export interface CreateAddressInput {
  label: string;
  fullAddress: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

export interface UpdateAddressInput {
  label?: string;
  fullAddress?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

export interface IAddressService {
  getAddresses(userId: string): Promise<IAddress[]>;
  createAddress(userId: string, data: CreateAddressInput): Promise<IAddress>;
  updateAddress(userId: string, addressId: string, data: UpdateAddressInput): Promise<IAddress>;
  deleteAddress(userId: string, addressId: string): Promise<void>;
  setDefaultAddress(userId: string, addressId: string): Promise<IAddress>;
}
