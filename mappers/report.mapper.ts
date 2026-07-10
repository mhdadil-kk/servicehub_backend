import { IReport } from "../models/report.model";

export interface ReportResponseDTO {
  _id: string;
  reporterId: any;
  reportedId: any;
  bookingId?: any;
  category: string;
  description: string;
  screenshot?: string;
  status: string;
  adminNotes?: string;
  actionTaken?: string;
  createdAt: string;
  updatedAt: string;
}

export class ReportMapper {
  static toResponse(report: IReport | any): ReportResponseDTO | null {
    if (!report) return null;

    const r = typeof report.toObject === "function" ? report.toObject() : report;

    return {
      _id: r._id.toString(),
      reporterId: r.reporterId && typeof r.reporterId === "object" ? {
        _id: r.reporterId._id?.toString(),
        name: r.reporterId.name,
        email: r.reporterId.email,
        phone: r.reporterId.phone,
        profilePhoto: r.reporterId.profilePhoto,
        role: r.reporterId.role,
      } : r.reporterId?.toString(),
      reportedId: r.reportedId && typeof r.reportedId === "object" ? {
        _id: r.reportedId._id?.toString(),
        name: r.reportedId.name,
        email: r.reportedId.email,
        phone: r.reportedId.phone,
        profilePhoto: r.reportedId.profilePhoto,
        role: r.reportedId.role,
      } : r.reportedId?.toString(),
      bookingId: r.bookingId && typeof r.bookingId === "object" ? {
        _id: r.bookingId._id?.toString(),
        date: r.bookingId.date,
        slot: r.bookingId.slot,
        status: r.bookingId.status,
      } : r.bookingId?.toString(),
      category: r.category,
      description: r.description,
      screenshot: r.screenshot,
      status: r.status,
      adminNotes: r.adminNotes,
      actionTaken: r.actionTaken,
      createdAt: new Date(r.createdAt || Date.now()).toISOString(),
      updatedAt: new Date(r.updatedAt || Date.now()).toISOString(),
    };
  }

  static toArrayResponse(reports: any[]): ReportResponseDTO[] {
    return reports.map((r) => this.toResponse(r)!).filter(Boolean);
  }
}
