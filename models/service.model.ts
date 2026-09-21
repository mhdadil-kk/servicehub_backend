import mongoose, { Schema, Document } from "mongoose";

export interface IServiceDocument extends Document {
  id: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
}

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
