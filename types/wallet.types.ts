import mongoose from "mongoose";

export interface IWallet {
  _id?: mongoose.Types.ObjectId;
  id: string;
  userId: string;
  balance: number;
  currency: string;
  createdAt?: Date;
  updatedAt?: Date;
}
