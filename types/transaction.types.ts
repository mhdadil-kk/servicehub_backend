import mongoose from "mongoose";

export interface ITransaction {
  _id?: mongoose.Types.ObjectId;
  id: string;
  walletId: string | mongoose.Types.ObjectId;
  userId: string | mongoose.Types.ObjectId;
  type: "credit" | "debit";
  amount: number;
  description: string;
  referenceId?: string | mongoose.Types.ObjectId;
  status: "pending" | "success" | "failed";
  createdAt?: Date;
  updatedAt?: Date;
}
