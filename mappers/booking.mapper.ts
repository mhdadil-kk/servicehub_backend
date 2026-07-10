import { IBooking } from "../types/booking.types";
import mongoose from "mongoose";

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
  provider?: any;
  service?: any;
  address?: any;
  user?: any;
  finalInvoice?: any;
}

export class BookingMapper {
  static toResponse(booking: IBooking | any): BookingResponseDTO | null {
    if (!booking) return null;

    const b = typeof booking.toObject === 'function' ? booking.toObject() : booking;

    return {
      _id: b._id?.toString(),
      userId: b.userId?.toString(),
      providerId: b.providerId?.toString(),
      serviceId: b.serviceId?.toString(),
      addressId: (b.addressId && typeof b.addressId === 'object') ? b.addressId : b.addressId?.toString(),
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

  static toDetailedResponse(booking: IBooking | any): DetailedBookingResponseDTO | null {
    if (!booking) return null;
    
    const base = this.toResponse(booking);
    if (!base) return null;
    
    const result: DetailedBookingResponseDTO = { ...base };
    const b = typeof booking.toObject === 'function' ? booking.toObject() : booking;

    if (b.providerId && typeof b.providerId === 'object' && ('userId' in b.providerId || 'hourlyRate' in b.providerId || 'address' in b.providerId)) {
      result.provider = {
        _id: b.providerId._id?.toString() || b.providerId.toString(),
        name: b.providerId.userId?.name || "",
        profilePhoto: b.providerId.profilePhoto,
        hourlyRate: b.providerId.hourlyRate,
      };
      result.providerId = b.providerId;
    }

    if (b.userId && typeof b.userId === 'object' && ('name' in b.userId || 'email' in b.userId)) {
       result.user = {
         _id: b.userId._id?.toString() || b.userId.toString(),
         name: b.userId.name,
         profilePhoto: b.userId.profilePhoto
       };
       result.userId = b.userId;
    }

    if (b.serviceId && typeof b.serviceId === 'object' && ('name' in b.serviceId || 'description' in b.serviceId)) {
      result.service = {
        _id: b.serviceId._id?.toString() || b.serviceId.toString(),
        name: b.serviceId.name,
        description: b.serviceId.description,
        categoryId: b.serviceId.categoryId?.toString()
      };
      result.serviceId = b.serviceId;
    }

    if (b.addressId && typeof b.addressId === 'object' && ('label' in b.addressId || 'fullAddress' in b.addressId)) {
      result.address = {
        _id: b.addressId._id?.toString() || b.addressId.toString(),
        label: b.addressId.label,
        fullAddress: b.addressId.fullAddress,
        latitude: b.addressId.latitude,
        longitude: b.addressId.longitude
      };
      result.addressId = b.addressId;
    }
    
    if (b.finalInvoice) {
      result.finalInvoice = {
        ...b.finalInvoice,
        _id: b.finalInvoice._id?.toString()
      };
    }

    return result;
  }

  static toArrayResponse(bookings: any[], detailed: boolean = false): (BookingResponseDTO | DetailedBookingResponseDTO)[] {
    return bookings.map(b => detailed ? this.toDetailedResponse(b)! : this.toResponse(b)!);
  }
}
