import mongoose, { Document, Schema } from "mongoose";

export interface IWalletDocument extends Document {
  userId: mongoose.Types.ObjectId;
  balance: number;
  currency: string;
}

const WalletSchema = new Schema<IWalletDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    balance: { type: Number, default: 0 },
    currency: { type: String, default: "INR" },
  },
  { timestamps: true }
);

export default mongoose.model<IWalletDocument>("Wallet", WalletSchema);
