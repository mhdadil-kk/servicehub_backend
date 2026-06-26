import mongoose, { Schema } from "mongoose";
import { IAddress } from "../types/address.types";

const AddressSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  label: { type: String, required: true }, 
  fullAddress: { type: String, required: true },
  latitude: { type: Number },
  longitude: { type: Number },
  isDefault: { type: Boolean, default: false }
}, { timestamps: true });


AddressSchema.index({ userId: 1 });

export default mongoose.model<IAddress>("Address", AddressSchema);
