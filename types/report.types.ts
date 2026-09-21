import mongoose from "mongoose";
export type ReportAction =
  | "warn"
  | "block"
  | "reject"
  | "resolve"
  | "none";
export interface IReport {
  _id?: mongoose.Types.ObjectId;
  id: string;
  reporterId: string | mongoose.Types.ObjectId | { _id: mongoose.Types.ObjectId; name?: string; email?: string; phone?: string; profilePhoto?: string; role?: string };
  reportedId: string | mongoose.Types.ObjectId | { _id: mongoose.Types.ObjectId; name?: string; email?: string; phone?: string; profilePhoto?: string; role?: string };
  bookingId?: string | mongoose.Types.ObjectId | { _id: mongoose.Types.ObjectId; date?: string; slot?: Record<string, unknown>; status?: string };
  category: "Fraud" | "Fake Profile" | "Harassment" | "Spam" | "Payment Issue" | "Inappropriate Behaviour" | "Service Quality" | "Other";
  description: string;
  screenshot?: string;
  status: "pending" | "under_review" | "resolved" | "rejected";
  adminNotes?: string;
  actionTaken?:ReportAction;
  createdAt?: Date;
  updatedAt?: Date;
}
