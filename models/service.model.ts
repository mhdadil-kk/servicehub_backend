import mongoose, { Schema, Document } from "mongoose";
import { IService } from "../types/service.types";

export interface IServiceDocument extends IService, Document {}

const ServiceSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

ServiceSchema.pre("validate", async function() {
  if (this.name && !this.slug) {
    this.slug = (this.name as string).toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");
  }
});

export default mongoose.model<IServiceDocument>("Service", ServiceSchema);
