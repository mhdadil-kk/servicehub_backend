import mongoose, { Document, Schema } from "mongoose";

export interface ITransactionDocument extends Document {
  walletId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: "credit" | "debit";
  amount: number;
  description: string;
  referenceId?: string;
  status: "pending" | "success" | "failed";
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransactionDocument>(
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

export default mongoose.model<ITransactionDocument>("Transaction", TransactionSchema);
