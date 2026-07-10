import mongoose, { Schema, Document } from "mongoose";

export interface IReport extends Document {
  reporterId: mongoose.Types.ObjectId;
  reportedId: mongoose.Types.ObjectId;
  bookingId?: mongoose.Types.ObjectId;
  category: "Fraud" | "Fake Profile" | "Harassment" | "Spam" | "Payment Issue" | "Inappropriate Behaviour" | "Service Quality" | "Other";
  description: string;
  screenshot?: string;
  status: "pending" | "under_review" | "resolved" | "rejected";
  adminNotes?: string;
  actionTaken?: "warn" | "block" | "reject" | "resolve" | "none";
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema: Schema = new Schema(
  {
    reporterId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reportedId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking" },
    category: {
      type: String,
      enum: ["Fraud", "Fake Profile", "Harassment", "Spam", "Payment Issue", "Inappropriate Behaviour", "Service Quality", "Other"],
      required: true,
    },
    description: { type: String, required: true },
    screenshot: { type: String },
    status: {
      type: String,
      enum: ["pending", "under_review", "resolved", "rejected"],
      default: "pending",
    },
    adminNotes: { type: String, default: "" },
    actionTaken: {
      type: String,
      enum: ["warn", "block", "reject", "resolve", "none"],
      default: "none",
    },
  },
  { timestamps: true }
);

ReportSchema.index({ reporterId: 1 });
ReportSchema.index({ reportedId: 1 });
ReportSchema.index({ status: 1 });

export default mongoose.model<IReport>("Report", ReportSchema);
