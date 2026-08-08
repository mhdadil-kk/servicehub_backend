import { IReport } from "../types/report.types";

export interface ReportResponseDTO {
  _id: string;
  reporterId: string | Record<string, unknown>;
  reportedId: string | Record<string, unknown>;
  bookingId?: string | Record<string, unknown>;
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
  static toResponse(report: IReport & { toObject?: () => IReport }): ReportResponseDTO | null {
    if (!report) return null;

    const r = typeof report.toObject === "function" ? report.toObject() : report;

    return {
      _id: (r as IReport & { _id?: { toString: () => string }; id?: string })._id?.toString() || (r as IReport & { id?: string }).id || "",
      reporterId: r.reporterId && typeof r.reporterId === "object" ? {
        _id: (r.reporterId as unknown as { _id?: { toString: () => string } })._id?.toString() || (r.reporterId as unknown as { toString: () => string }).toString(),
        name: (r.reporterId as unknown as { name?: string }).name,
        email: (r.reporterId as unknown as { email?: string }).email,
        phone: (r.reporterId as unknown as { phone?: string }).phone,
        profilePhoto: (r.reporterId as unknown as { profilePhoto?: string }).profilePhoto,
        role: (r.reporterId as unknown as { role?: string }).role,
      } : (r.reporterId as unknown as { toString: () => string })?.toString(),
      reportedId: r.reportedId && typeof r.reportedId === "object" ? {
        _id: (r.reportedId as unknown as { _id?: { toString: () => string } })._id?.toString() || (r.reportedId as unknown as { toString: () => string }).toString(),
        name: (r.reportedId as unknown as { name?: string }).name,
        email: (r.reportedId as unknown as { email?: string }).email,
        phone: (r.reportedId as unknown as { phone?: string }).phone,
        profilePhoto: (r.reportedId as unknown as { profilePhoto?: string }).profilePhoto,
        role: (r.reportedId as unknown as { role?: string }).role,
      } : (r.reportedId as unknown as { toString: () => string })?.toString(),
      bookingId: r.bookingId && typeof r.bookingId === "object" ? {
        _id: (r.bookingId as unknown as { _id?: { toString: () => string } })._id?.toString() || (r.bookingId as unknown as { toString: () => string }).toString(),
        date: (r.bookingId as unknown as { date?: string }).date,
        slot: (r.bookingId as unknown as { slot?: Record<string, unknown> }).slot,
        status: (r.bookingId as unknown as { status?: string }).status,
      } : (r.bookingId as unknown as { toString: () => string })?.toString(),
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

  static toArrayResponse(reports: (IReport & { toObject?: () => IReport })[]): ReportResponseDTO[] {
    return reports.map((r) => this.toResponse(r)!).filter(Boolean);
  }
}
