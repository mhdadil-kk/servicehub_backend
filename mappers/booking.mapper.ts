import { IBooking } from "../types/booking.types";

export interface BookingResponseDTO {
  _id: string;
  userId: string;
  providerId: string;
  serviceId: string;
  addressId: string;
  date: string;
  slot: {
    start: string;
    end: string;
  };
  status: string;
  notes?: string;
  cancelledBy?: string;
  cancellationReason?: string;
  rescheduledFrom?: string;
  rescheduledTo?: string;
  totalAmount: number;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface DetailedBookingResponseDTO extends BookingResponseDTO {
  provider?: Record<string, unknown>;
  service?: Record<string, unknown>;
  address?: Record<string, unknown>;
  user?: Record<string, unknown>;
  finalInvoice?: Record<string, unknown>;
}

export class BookingMapper {
  static toResponse(booking: IBooking & { toObject?: () => IBooking }): BookingResponseDTO | null {
    if (!booking) return null;

    const b = typeof booking.toObject === 'function' ? booking.toObject() : booking;

    return {
      _id: (b as IBooking & { _id?: { toString: () => string }; id?: string })._id?.toString() || (b as IBooking & { id?: string }).id || "",
      userId: b.userId?.toString(),
      providerId: b.providerId?.toString(),
      serviceId: b.serviceId?.toString(),
      addressId: (b.addressId && typeof b.addressId === 'object') ? b.addressId as unknown as string : b.addressId?.toString(),
      date: b.date,
      slot: b.slot,
      status: b.status,
      notes: b.notes,
      cancelledBy: b.cancelledBy,
      cancellationReason: b.cancellationReason,
      rescheduledFrom: b.rescheduledFrom?.toString(),
      rescheduledTo: b.rescheduledTo?.toString(),
      totalAmount: b.totalAmount,
      paymentStatus: b.paymentStatus,
      createdAt: new Date(b.createdAt || Date.now()).toISOString(),
      updatedAt: new Date(b.updatedAt || Date.now()).toISOString(),
    };
  }

  static toDetailedResponse(booking: IBooking & { toObject?: () => IBooking }): DetailedBookingResponseDTO | null {
    if (!booking) return null;
    
    const base = this.toResponse(booking);
    if (!base) return null;
    
    const result: DetailedBookingResponseDTO = { ...base };
    const b = typeof booking.toObject === 'function' ? booking.toObject() : booking;

    if (b.providerId && typeof b.providerId === 'object' && ('userId' in b.providerId || 'hourlyRate' in b.providerId || 'address' in b.providerId)) {
      const providerObj = b.providerId as unknown as { _id?: { toString: () => string }; userId?: { name: string }; profilePhoto?: string; hourlyRate?: number };
      result.provider = {
        _id: providerObj._id?.toString() || (b.providerId as unknown as { toString: () => string }).toString(),
        name: providerObj.userId?.name || "",
        profilePhoto: providerObj.profilePhoto,
        hourlyRate: providerObj.hourlyRate,
      };
      result.providerId = b.providerId as unknown as string;
    }

    if (b.userId && typeof b.userId === 'object' && ('name' in b.userId || 'email' in b.userId)) {
      const userObj = b.userId as unknown as { _id?: { toString: () => string }; name?: string; profilePhoto?: string };
       result.user = {
         _id: userObj._id?.toString() || (b.userId as unknown as { toString: () => string }).toString(),
         name: userObj.name,
         profilePhoto: userObj.profilePhoto
       };
       result.userId = b.userId as unknown as string;
    }

    if (b.serviceId && typeof b.serviceId === 'object' && ('name' in b.serviceId || 'description' in b.serviceId)) {
      const serviceObj = b.serviceId as unknown as { _id?: { toString: () => string }; name?: string; description?: string; categoryId?: { toString: () => string } };
      result.service = {
        _id: serviceObj._id?.toString() || (b.serviceId as unknown as { toString: () => string }).toString(),
        name: serviceObj.name,
        description: serviceObj.description,
        categoryId: serviceObj.categoryId?.toString()
      };
      result.serviceId = b.serviceId as unknown as string;
    }

    if (b.addressId && typeof b.addressId === 'object' && ('label' in b.addressId || 'fullAddress' in b.addressId)) {
      const addressObj = b.addressId as unknown as { _id?: { toString: () => string }; label?: string; fullAddress?: string; latitude?: number; longitude?: number };
      result.address = {
        _id: addressObj._id?.toString() || (b.addressId as unknown as { toString: () => string }).toString(),
        label: addressObj.label,
        fullAddress: addressObj.fullAddress,
        latitude: addressObj.latitude,
        longitude: addressObj.longitude
      };
      result.addressId = b.addressId as unknown as string;
    }
    
    if (b.finalInvoice) {
      result.finalInvoice = {
        ...(b.finalInvoice as Record<string, unknown>),
        _id: (b.finalInvoice as unknown as { _id?: { toString: () => string } })._id?.toString()
      };
    }

    return result;
  }

  static toArrayResponse(bookings: (IBooking & { toObject?: () => IBooking })[], detailed: boolean = false): (BookingResponseDTO | DetailedBookingResponseDTO)[] {
    return bookings.map(b => detailed ? this.toDetailedResponse(b)! : this.toResponse(b)!);
  }
}
