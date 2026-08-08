import mongoose from "mongoose";
import AddressModel from "../models/address.model";
import { IAddress } from "../types/address.types";
import { BaseRepository } from "./base.repository";

import { IAddressRepository } from "../interfaces/repositories/IAddressRepository";

export class AddressRepository
  extends BaseRepository<IAddress>
  implements IAddressRepository
{
  constructor() {
    super(AddressModel);
  }

  async findByUserId(userId: string): Promise<IAddress[]> {
    return this.model
      .find({ userId } as mongoose.FilterQuery<IAddress>)
      .sort({ isDefault: -1, createdAt: -1 })
      .exec();
  }

  async countByUserId(userId: string): Promise<number> {
    return this.count({ userId } as mongoose.FilterQuery<IAddress>);
  }

  async findByIdForUser(addressId: string, userId: string): Promise<IAddress | null> {
    return this.findOne({ _id: addressId, userId } as mongoose.FilterQuery<IAddress>);
  }

  async findOtherByUserId(userId: string, excludeId: string): Promise<IAddress | null> {
    return this.findOne({ userId, _id: { $ne: excludeId } } as mongoose.FilterQuery<IAddress>);
  }

  async findFirstByUserId(userId: string): Promise<IAddress | null> {
    return this.findOne({ userId } as mongoose.FilterQuery<IAddress>);
  }

  async create(data: Partial<IAddress>): Promise<IAddress> {
    return super.create(data);
  }

  async updateById(addressId: string, data: Partial<IAddress>): Promise<IAddress | null> {
    return this.update(addressId, data);
  }

  async clearDefaultForUser(userId: string): Promise<void> {
    await this.model.updateMany({ userId }, { $set: { isDefault: false } }).exec();
  }

  async deleteByIdForUser(addressId: string, userId: string): Promise<boolean> {
    const result = await this.model
      .deleteOne({ _id: addressId, userId } as mongoose.FilterQuery<IAddress>)
      .exec();
    return result.deletedCount > 0;
  }
}
