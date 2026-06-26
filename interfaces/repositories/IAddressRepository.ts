import { IAddress } from "../../types/address.types";

export interface IAddressRepository {
  findByUserId(userId: string): Promise<IAddress[]>;
  countByUserId(userId: string): Promise<number>;
  findByIdForUser(addressId: string, userId: string): Promise<IAddress | null>;
  findOtherByUserId(userId: string, excludeId: string): Promise<IAddress | null>;
  findFirstByUserId(userId: string): Promise<IAddress | null>;
  create(data: Partial<IAddress>): Promise<IAddress>;
  updateById(addressId: string, data: Partial<IAddress>): Promise<IAddress | null>;
  clearDefaultForUser(userId: string): Promise<void>;
  deleteByIdForUser(addressId: string, userId: string): Promise<boolean>;
}
