import { ReportResponseDTO, CreateReportInputDTO } from "../../dtos/report.dto";

export interface IReportService {
  createReport(reporterId: string, data: CreateReportInputDTO): Promise<ReportResponseDTO>;
  getMyReports(userId: string): Promise<ReportResponseDTO[]>;
  getReportById(reportId: string, userId: string, role: string): Promise<ReportResponseDTO>;
  getAllReports(filter: { status?: string; search?: string }, page?: number, limit?: number): Promise<{ reports: ReportResponseDTO[]; total: number }>;
  takeAction(reportId: string, action: "warn" | "block" | "reject" | "resolve", adminNotes: string): Promise<ReportResponseDTO>;
}
