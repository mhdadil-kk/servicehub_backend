import { IBooking } from "../types/booking.types";
import { BookingResponseDTO, DetailedBookingResponseDTO } from "../dtos/booking.dto";

export class BookingMapper {
  static toResponse(booking: IBooking & { toObject?: () => IBooking }): BookingResponseDTO | null {
    if (!booking) return null;

    const b = typeof booking.toObject === 'function' ? booking.toObject() : booking;

    const userIdStr = typeof b.userId === 'object' && b.userId !== null && '_id' in b.userId
      ? b.userId._id.toString()
      : b.userId ? b.userId.toString() : "";

    const providerIdStr = typeof b.providerId === 'object' && b.providerId !== null && '_id' in b.providerId
      ? b.providerId._id.toString()
      : b.providerId ? b.providerId.toString() : "";

    const serviceIdStr = typeof b.serviceId === 'object' && b.serviceId !== null && '_id' in b.serviceId
      ? b.serviceId._id.toString()
      : b.serviceId ? b.serviceId.toString() : "";

    const addressIdStr = typeof b.addressId === 'object' && b.addressId !== null && '_id' in b.addressId
      ? b.addressId._id.toString()
      : b.addressId ? b.addressId.toString() : undefined;

    return {
      _id: b._id?.toString() || b.id || "",
      userId: userIdStr,
      providerId: providerIdStr,
      serviceId: serviceIdStr,
      addressId: addressIdStr,
      date: b.date,
      slot: b.slot,
      status: b.status,
      paymentStatus: b.paymentStatus,
      totalAmount: b.totalAmount,
      notes: b.notes,
      cancelledBy: b.cancelledBy,
      cancellationReason: b.cancellationReason,
      finalInvoice: b.finalInvoice ? {
        baseCharge: b.finalInvoice.baseCharge,
        extraCharges: b.finalInvoice.extraCharges?.map(e => ({
          description: e.description,
          amount: e.amount,
        })) || []
      } : undefined,
      createdAt: new Date(b.createdAt || Date.now()).toISOString(),
      updatedAt: new Date(b.updatedAt || Date.now()).toISOString(),
    };
  }

  static toDetailedResponse(booking: IBooking & { toObject?: () => IBooking }): DetailedBookingResponseDTO | null {
    if (!booking) return null;

    const base = this.toResponse(booking);
    if (!base) return null;

    const b = typeof booking.toObject === 'function' ? booking.toObject() : booking;
    const result: DetailedBookingResponseDTO = { ...base };

    if (b.providerId && typeof b.providerId === 'object' && '_id' in b.providerId) {
      const p = b.providerId;
      const userName = typeof p.userId === 'object' && p.userId !== null && 'name' in p.userId
        ? p.userId.name || ""
        : "";

      result.provider = {
        _id: p._id.toString(),
        userId: { name: userName },
        profilePhoto: p.profilePhoto,
        hourlyRate: p.hourlyRate,
      };
      result.providerId = p._id.toString();
    }

    if (b.userId && typeof b.userId === 'object' && '_id' in b.userId) {
      const u = b.userId;
      result.user = {
        _id: u._id.toString(),
        name: u.name || "",
        profilePhoto: u.profilePhoto,
      };
      result.userId = u._id.toString();
    }

    if (b.serviceId && typeof b.serviceId === 'object' && '_id' in b.serviceId) {
      const s = b.serviceId;
      result.service = {
        _id: s._id.toString(),
        name: s.name || "",
        description: s.description,
      };
      result.serviceId = s._id.toString();
    }

    if (b.addressId && typeof b.addressId === 'object' && '_id' in b.addressId) {
      const a = b.addressId;
      result.address = {
        _id: a._id.toString(),
        label: a.label || "",
        fullAddress: a.fullAddress || "",
        latitude: a.latitude,
        longitude: a.longitude,
      };
      result.addressId = a._id.toString();
    }

    return result;
  }

  static toArrayResponse(
    bookings: (IBooking & { toObject?: () => IBooking })[],
    detailed = false
  ): (BookingResponseDTO | DetailedBookingResponseDTO)[] {
    return bookings.map(b => (detailed ? this.toDetailedResponse(b)! : this.toResponse(b)!));
  }
}
