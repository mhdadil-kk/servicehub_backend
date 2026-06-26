import mongoose, { Document, Schema } from "mongoose";

export interface ITransaction extends Document {
  walletId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: "credit" | "debit";
  amount: number;
  description: string;
  referenceId?: mongoose.Types.ObjectId; 
  status: "pending" | "success" | "failed";
}

const TransactionSchema = new Schema<ITransaction>(
  {
    walletId: { type: Schema.Types.ObjectId, ref: "Wallet", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["credit", "debit"], required: true },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    referenceId: { type: Schema.Types.ObjectId, ref: "Booking" }, 
    status: { type: String, enum: ["pending", "success", "failed"], default: "success" },
  },
  { timestamps: true }
);

export default mongoose.model<ITransaction>("Transaction", TransactionSchema);
