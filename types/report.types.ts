export interface IReport {
  id: string;
  reporterId: string;
  reportedId: string;
  bookingId?: string;
  category: "Fraud" | "Fake Profile" | "Harassment" | "Spam" | "Payment Issue" | "Inappropriate Behaviour" | "Service Quality" | "Other";
  description: string;
  screenshot?: string;
  status: "pending" | "under_review" | "resolved" | "rejected";
  adminNotes?: string;
  actionTaken?: "warn" | "block" | "reject" | "resolve" | "none";
  createdAt?: Date;
  updatedAt?: Date;
}
