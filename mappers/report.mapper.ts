import { IReport } from "../types/report.types";
import { ReportResponseDTO, ReportUserSnippetDTO, ReportBookingSnippetDTO } from "../dtos/report.dto";

export class ReportMapper {
  static toResponse(report: IReport & { toObject?: () => IReport }): ReportResponseDTO | null {
    if (!report) return null;

    const r = typeof report.toObject === 'function' ? report.toObject() : report;

    let reporter: ReportUserSnippetDTO | string = r.reporterId ? r.reporterId.toString() : "";
    if (r.reporterId && typeof r.reporterId === 'object' && ('name' in r.reporterId ||
      'email' in r.reporterId ||
      'phone' in r.reporterId ||
      'profilePhoto' in r.reporterId ||
      'role' in r.reporterId)
    ) {
      const u = r.reporterId;
      reporter = {
        _id: u._id.toString(),
        name: u.name,
        email: u.email,
        phone: u.phone,
        profilePhoto: u.profilePhoto,
        role: u.role,
      };
    }

    let reported: ReportUserSnippetDTO | string = r.reportedId ? r.reportedId.toString() : "";
    if (r.reportedId && typeof r.reportedId === 'object' &&
      (
        "name" in r.reportedId ||
        "email" in r.reportedId ||
        "phone" in r.reportedId ||
        "profilePhoto" in r.reportedId ||
        "role" in r.reportedId
      )
    ) {
      const u = r.reportedId;
      reported = {
        _id: u._id.toString(),
        name: u.name,
        email: u.email,
        phone: u.phone,
        profilePhoto: u.profilePhoto,
        role: u.role,
      };
    }

    let booking: ReportBookingSnippetDTO | string | undefined = undefined;
    if (r.bookingId) {
      if (typeof r.bookingId === 'object' && ('date' in r.bookingId || 'slot' in r.bookingId || 'status' in r.bookingId)
      ) {
        const b = r.bookingId;
        booking = {
          _id: b._id.toString(),
          date: b.date,
          slot: b.slot,
          status: b.status,
        };
      } else {
        booking = r.bookingId.toString();
      }
    }

    return {
      _id: r._id?.toString() || r.id || "",
      reporterId: reporter,
      reportedId: reported,
      bookingId: booking,
      category: r.category,
      description: r.description,
      screenshot: r.screenshot,
      status: r.status,
      actionTaken: r.actionTaken,
      adminNotes: r.adminNotes,
      createdAt: new Date(r.createdAt || Date.now()).toISOString(),
      updatedAt: new Date(r.updatedAt || Date.now()).toISOString(),
    };
  }

  static toArrayResponse(reports: (IReport & { toObject?: () => IReport })[]): ReportResponseDTO[] {
    return reports.map(r => this.toResponse(r)!);
  }
}
