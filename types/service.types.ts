import mongoose from "mongoose";

export interface IService {
  _id?: mongoose.Types.ObjectId;
  id: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
}
