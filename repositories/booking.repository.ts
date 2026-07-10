import bookingModel from "../models/booking.model";
import { IBooking } from "../types/booking.types";
import { BaseRepository } from "./base.repository";
import { FilterQuery } from "mongoose";
import { IBookingRepository, AvailableSlot } from "../interfaces/repositories/IBookingRepository";

export class BookingRepository
  extends BaseRepository<IBooking>
  implements IBookingRepository
{
  constructor() {
    super(bookingModel);
  }

  async create(data: Partial<IBooking>): Promise<IBooking> {
    return super.create(data);
  }

  async countByUserId(userId: string, statuses?: string[]): Promise<number> {
    const filter: FilterQuery<IBooking> = { userId };
    if (statuses?.length) filter.status = { $in: statuses };
    return this.count(filter);
  }

  async countByProviderId(providerId: string, statuses?: string[]): Promise<number> {
    const filter: FilterQuery<IBooking> = { providerId };
    if (statuses?.length) filter.status = { $in: statuses };
    return this.count(filter);
  }

  async findRecentByUserId(userId: string, limit = 5): Promise<IBooking[]> {
    return this.model
      .find({ userId } as FilterQuery<IBooking>)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate({
        path: "providerId",
        populate: { path: "userId", select: "name email phone profilePhoto" },
      })
      .populate("serviceId", "name description")
      .exec();
  }

  async findRecentByProviderId(providerId: string, limit = 5): Promise<IBooking[]> {
    return this.model
      .find({ providerId } as FilterQuery<IBooking>)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("userId", "name email phone profilePhoto")
      .populate("serviceId", "name description")
      .exec();
  }

  async findByIdWithService(id: string): Promise<IBooking | null> {
    return this.model.findById(id).populate("serviceId", "name description").exec();
  }

  async findByIdWithProviderUser(id: string): Promise<IBooking | null> {
  
    return this.model
      .findById(id)
      .populate("providerId")
      .exec();
  }

  async findByIdWithProviderAndUser(id: string): Promise<IBooking | null> {
    return this.model
      .findById(id)
      .populate("providerId")
      .populate("userId")
      .exec();
  }

  async updateStripeSession(id: string, stripeSessionId: string): Promise<IBooking | null> {
    return this.update(id, { stripeSessionId });
  }

  async confirmBookingFeePaid(id: string): Promise<IBooking | null> {
    return this.model.findOneAndUpdate(
      { _id: id, status: "awaiting_payment" },
      { paymentStatus: "paid", status: "confirmed" },
      { new: true }
    ).exec();
  }

  async confirmFinalPaymentPaid(id: string): Promise<IBooking | null> {
    return this.model.findOneAndUpdate(
      { _id: id, status: "completed_pending_payment" },
      { paymentStatus: "fully_paid", status: "completed" },
      { new: true }
    ).exec();
  }

  async findActiveByProviderAndDate(
    providerId: string,
    date: string,
    statuses: string[]
  ): Promise<IBooking[]> {
    return this.model
      .find({ providerId, date, status: { $in: statuses } } as FilterQuery<IBooking>)
      .exec();
  }

  async findByUserIdPopulated(userId: string): Promise<IBooking[]> {
    return this.model
      .find({ userId } as FilterQuery<IBooking>)
      .populate({
        path: "providerId",
        populate: { path: "userId", select: "name email phone profilePhoto" },
      })
      .populate("serviceId", "name description")
      .populate("addressId")
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByProviderIdPopulated(providerId: string): Promise<IBooking[]> {
    return this.model
      .find({ providerId } as FilterQuery<IBooking>)
      .populate("userId", "name email phone")
      .populate("serviceId", "name description")
      .populate("addressId")
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOneForUser(bookingId: string, userId: string): Promise<IBooking | null> {
    return this.findOne({ _id: bookingId, userId } as FilterQuery<IBooking>);
  }

  async findOneForProvider(
    bookingId: string,
    providerProfileId: string
  ): Promise<IBooking | null> {
    return this.findOne({ _id: bookingId, providerId: providerProfileId } as FilterQuery<IBooking>);
  }

  async findDetailForUser(bookingId: string, userId: string): Promise<IBooking | null> {
    return this.model
      .findOne({ _id: bookingId, userId } as FilterQuery<IBooking>)
      .populate({
        path: "providerId",
        populate: { path: "userId", select: "name email phone profilePhoto" },
      })
      .populate("userId", "name email phone")
      .populate("serviceId", "name description")
      .populate("addressId")
      .exec();
  }

  async findDetailForProvider(
    bookingId: string,
    providerProfileId: string
  ): Promise<IBooking | null> {
    return this.model
      .findOne({ _id: bookingId, providerId: providerProfileId } as FilterQuery<IBooking>)
      .populate({
        path: "providerId",
        populate: { path: "userId", select: "name email phone profilePhoto" },
      })
      .populate("userId", "name email phone")
      .populate("serviceId", "name description")
      .populate("addressId")
      .exec();
  }

  async updateStatus(bookingId: string, data: Partial<IBooking>): Promise<IBooking | null> {
    return this.model.findByIdAndUpdate(bookingId, { $set: data }, { new: true }).exec();
  }
}