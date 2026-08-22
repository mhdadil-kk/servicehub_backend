import { AddressResponseDTO, CreateAddressSchema, UpdateAddressSchema } from "../../dtos/address.dto";
import { z } from "zod";

export type CreateAddressInput = z.infer<typeof CreateAddressSchema>["body"];
export type UpdateAddressInput = z.infer<typeof UpdateAddressSchema>["body"];

export interface IAddressService {
  getAddresses(userId: string): Promise<AddressResponseDTO[]>;
  createAddress(userId: string, data: CreateAddressInput): Promise<AddressResponseDTO>;
  updateAddress(userId: string, addressId: string, data: UpdateAddressInput): Promise<AddressResponseDTO>;
  deleteAddress(userId: string, addressId: string): Promise<void>;
  setDefaultAddress(userId: string, addressId: string): Promise<AddressResponseDTO>;
}
