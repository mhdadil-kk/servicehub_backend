import Booking from "../models/booking.model";
import ProviderAvailability from "../models/providerAvailability.model";
import ProviderProfile from "../models/providerProfile.model";
import Conversation from "../models/conversation.model";
import Message from "../models/message.model";
import { IBooking } from "../types/booking.types";
import { NotFoundError, BadRequestError } from "../utils/error";
import mongoose from "mongoose";

export class BookingService {
  
  // Calculate available slots for a provider on a specific date YYYY-MM-DD
  async getAvailableSlots(providerProfileId: string, dateStr: string): Promise<any[]> {
    const availability = await ProviderAvailability.findOne({ providerId: providerProfileId });
    if (!availability) {
      return [];
    }

    // 1. Check top-level date range limits
    if (availability.startDate && dateStr < availability.startDate) {
      return [];
    }
    if (availability.endDate && dateStr > availability.endDate) {
      return [];
    }

    // Determine day of the week
    const dateObj = new Date(dateStr);
    const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const weekday = weekdays[dateObj.getDay()];

    let slots: any[] = [];
    let isAvailable = false;

    // 2. Check if there is an override for this specific date
    const override = availability.overrides.find((ov: any) => ov.date === dateStr);
    if (override) {
      isAvailable = override.isAvailable;
      slots = override.isAvailable ? override.slots : [];
    } else {
      // 3. Fallback to weekly schedule
      const daySchedule = (availability.weeklySchedule as any)[weekday];
      if (daySchedule) {
        isAvailable = daySchedule.isAvailable;
        slots = daySchedule.isAvailable ? daySchedule.slots : [];
      }
    }

    if (!isAvailable || slots.length === 0) {
      return [];
    }

    // 4. Fetch existing active bookings for this provider on this date to mark booked slots
    const activeBookings = await Booking.find({
      providerId: providerProfileId,
      date: dateStr,
      status: { $in: ["pending", "confirmed"] }
    });

    return slots.map((slot: any) => {
      // Check if slot overlaps with any active booking
      const isBooked = activeBookings.some((b: any) => 
        b.slot.start === slot.start && b.slot.end === slot.end
      );
      
      return {
        id: slot.id,
        start: slot.start,
        end: slot.end,
        isBooked
      };
    });
  }

  async createBooking(userId: string, data: any): Promise<IBooking> {
    const { providerId, serviceId, addressId, date, slot, notes, rescheduledFrom } = data;

    if (!providerId || !serviceId || !addressId || !date || !slot || !slot.start || !slot.end) {
      throw new BadRequestError("All booking details are required");
    }

    // Check if slot is available and not already booked
    const availableSlots = await this.getAvailableSlots(providerId, date);
    const matchingSlot = availableSlots.find(s => s.start === slot.start && s.end === slot.end);
    
    if (!matchingSlot) {
      throw new BadRequestError("The requested time slot is not available");
    }
    if (matchingSlot.isBooked) {
      throw new BadRequestError("The requested time slot is already booked");
    }

    const booking = new Booking({
      userId,
      providerId,
      serviceId,
      addressId,
      date,
      slot,
      notes,
      rescheduledFrom,
      status: "pending"
    });

    const savedBooking = await booking.save();

    // Create or reuse a conversation for this booking immediately so chat is available
    // right away without self-healing on every page load.
    try {
      const provProfile = await ProviderProfile.findById(providerId);
      if (provProfile) {
        const userObjId = new mongoose.Types.ObjectId(userId);
        const provObjId = new mongoose.Types.ObjectId(provProfile.userId.toString());
        
        let existingConv = await Conversation.findOne({
          participants: { $all: [userObjId, provObjId], $size: 2 }
        });
        
        if (!existingConv) {
          const sorted = [userObjId, provObjId].sort((a, b) => a.toString().localeCompare(b.toString()));
          existingConv = await Conversation.create({
            participants: sorted,
            bookingId: savedBooking._id
          });
        } else {
          existingConv.bookingId = savedBooking._id;
          await existingConv.save();
        }

        // Send a system message indicating a booking was created
        await Message.create({
          conversationId: existingConv._id,
          bookingId: savedBooking._id,
          senderId: userObjId,
          senderRole: "user",
          messageType: "booking_card",
          content: "I have requested a new booking.",
          read: false,
          delivered: false
        });
      }
    } catch (e) {
      // Non-fatal: conversation can still be created later via chat page
      console.error("Failed to create conversation for booking:", e);
    }

    return savedBooking;
  }

  async getUserBookings(userId: string): Promise<IBooking[]> {
    return await Booking.find({ userId })
      .populate({
        path: "providerId",
        populate: { path: "userId", select: "name email phone profilePhoto" }
      })
      .populate("serviceId", "name description")
      .populate("addressId")
      .sort({ createdAt: -1 });
  }

  async getProviderBookings(userId: string): Promise<IBooking[]> {
    // Need to find providerProfile first
    const profile = await ProviderProfile.findOne({ userId });
    if (!profile) {
      throw new NotFoundError("Provider profile not found");
    }

    return await Booking.find({ providerId: profile._id })
      .populate("userId", "name email phone")
      .populate("serviceId", "name description")
      .populate("addressId")
      .sort({ createdAt: -1 });
  }

  async getBookingDetail(bookingId: string, userId: string, role: string): Promise<IBooking> {
    const query: any = { _id: bookingId };
    
    if (role === "user") {
      query.userId = userId;
    } else if (role === "provider") {
      const profile = await ProviderProfile.findOne({ userId });
      if (!profile) throw new NotFoundError("Provider profile not found");
      query.providerId = profile._id;
    }

    const booking = await Booking.findOne(query)
      .populate({
        path: "providerId",
        populate: { path: "userId", select: "name email phone profilePhoto" }
      })
      .populate("userId", "name email phone")
      .populate("serviceId", "name description")
      .populate("addressId");

    if (!booking) {
      throw new NotFoundError("Booking not found");
    }
    return booking;
  }

  async updateBookingStatus(bookingId: string, userId: string, status: "confirmed" | "completed" | "cancelled"): Promise<IBooking> {
    const profile = await ProviderProfile.findOne({ userId });
    if (!profile) {
      throw new NotFoundError("Provider profile not found");
    }

    const booking = await Booking.findOne({ _id: bookingId, providerId: profile._id });
    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    // Business rules for completion/confirmation
    if (status === "completed" && booking.status !== "confirmed") {
      throw new BadRequestError("Only confirmed bookings can be marked as completed");
    }

    booking.status = status;
    return await booking.save();
  }

  async cancelBooking(bookingId: string, userId: string, role: string, reason: string): Promise<IBooking> {
    const query: any = { _id: bookingId };
    
    if (role === "user") {
      query.userId = userId;
    } else {
      const profile = await ProviderProfile.findOne({ userId });
      if (!profile) throw new NotFoundError("Provider profile not found");
      query.providerId = profile._id;
    }

    const booking = await Booking.findOne(query);
    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    if (booking.status === "cancelled" || booking.status === "completed") {
      throw new BadRequestError(`Cannot cancel a booking that is already ${booking.status}`);
    }

    // Business rule: cannot cancel within 2 hours of appointment
    const bookingDateTime = new Date(`${booking.date}T${booking.slot.start}:00`);
    const now = new Date();
    const diffHours = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < 2) {
      throw new BadRequestError("Bookings cannot be cancelled within 2 hours of the scheduled time");
    }

    booking.status = "cancelled";
    booking.cancelledBy = role === "user" ? "user" : "provider";
    booking.cancellationReason = reason || "No reason provided";

    return await booking.save();
  }

  async rescheduleBooking(bookingId: string, userId: string, data: any): Promise<IBooking> {
    const originalBooking = await Booking.findOne({ _id: bookingId, userId });
    if (!originalBooking) {
      throw new NotFoundError("Booking not found");
    }

    if (originalBooking.status === "cancelled" || originalBooking.status === "completed") {
      throw new BadRequestError(`Cannot reschedule a booking that is already ${originalBooking.status}`);
    }

    // Check 2-hour window limit for rescheduling as well
    const bookingDateTime = new Date(`${originalBooking.date}T${originalBooking.slot.start}:00`);
    const now = new Date();
    const diffHours = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < 2) {
      throw new BadRequestError("Bookings cannot be rescheduled within 2 hours of the scheduled time");
    }

    // 1. Cancel original booking
    originalBooking.status = "cancelled";
    originalBooking.cancelledBy = "user";
    originalBooking.cancellationReason = "Rescheduled by customer";
    await originalBooking.save();

    // 2. Create new booking
    const newBookingData = {
      providerId: originalBooking.providerId,
      serviceId: originalBooking.serviceId,
      addressId: data.addressId || originalBooking.addressId,
      date: data.date,
      slot: data.slot,
      notes: data.notes || originalBooking.notes,
      rescheduledFrom: originalBooking._id
    };

    return await this.createBooking(userId, newBookingData);
  }
}
