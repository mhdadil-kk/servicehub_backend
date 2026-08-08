import { IReport } from "../../types/report.types";

export interface CreateReportInput {
  reportedId: string;
  bookingId?: string;
  category: "Fraud" | "Fake Profile" | "Harassment" | "Spam" | "Payment Issue" | "Inappropriate Behaviour" | "Service Quality" | "Other";
  description: string;
  screenshot?: string;
}

export interface IReportService {
  createReport(reporterId: string, data: CreateReportInput): Promise<IReport>;
  getMyReports(userId: string): Promise<IReport[]>;
  getReportById(reportId: string, userId: string, role: string): Promise<IReport>;
  getAllReports(filter: { status?: string; search?: string }, page?: number, limit?: number): Promise<{ reports: IReport[]; total: number }>;
  takeAction(reportId: string, action: "warn" | "block" | "reject" | "resolve", adminNotes: string): Promise<IReport>;
}
