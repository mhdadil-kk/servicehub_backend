import Booking from "../models/booking.model";
import ProviderAvailability from "../models/providerAvailability.model";
import ProviderProfile from "../models/providerProfile.model";
import Conversation from "../models/conversation.model";
import Message from "../models/message.model";
import Notification from "../models/notification.model";
import { Mailer } from "../utils/mailer";
import { IBooking } from "../types/booking.types";
import { NotFoundError, BadRequestError } from "../utils/error";
import mongoose from "mongoose";

const mailer = new Mailer();

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
          content: "Booking created",
          readBy: [userObjId]
        });

        // Trigger notification to provider
        await Notification.create({
          userId: provProfile.userId,
          title: "New Booking Request",
          message: `You have received a new booking request for ${date} at ${slot.start}.`,
          type: "info",
          relatedId: savedBooking._id
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

  async acceptBooking(bookingId: string, userId: string): Promise<IBooking> {
    const profile = await ProviderProfile.findOne({ userId });
    if (!profile) {
      throw new NotFoundError("Provider profile not found");
    }

    const booking = await Booking.findOne({ _id: bookingId, providerId: profile._id });
    if (!booking) {
      throw new NotFoundError("Booking not found");
    }

    if (booking.status !== "pending") {
      throw new BadRequestError("Only pending bookings can be accepted");
    }

    booking.status = "awaiting_payment";
    await booking.save();

    await Notification.create({
      userId: booking.userId,
      title: "Booking Accepted! 🎉",
      message: `Provider accepted! Pay the ₹100 booking fee to confirm your slot.`,
      type: "success",
      relatedId: booking._id
    });

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
    await booking.save();

    // Notify customer of status change
    if (status === "confirmed") {
      await Notification.create({
        userId: booking.userId,
        title: "Booking Confirmed! 🎉",
        message: `Your booking for ${booking.date} at ${booking.slot.start} has been confirmed.`,
        type: "success",
        relatedId: booking._id
      });
    } else if (status === "cancelled") {
      await Notification.create({
        userId: booking.userId,
        title: "Booking Cancelled",
        message: `Your booking for ${booking.date} has been cancelled by the provider.`,
        type: "warning",
        relatedId: booking._id
      });
    }

    return booking;
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
    await booking.save();

    // Notify the OTHER party of the cancellation
    if (role === "user") {
      // Notify provider
      const provProfile = await ProviderProfile.findById(booking.providerId);
      if (provProfile) {
        await Notification.create({
          userId: provProfile.userId,
          title: "Booking Cancelled by Customer",
          message: `A customer cancelled their booking for ${booking.date} at ${booking.slot.start}.`,
          type: "warning",
          relatedId: booking._id
        });
      }
    } else {
      // Notify customer
      await Notification.create({
        userId: booking.userId,
        title: "Booking Cancelled by Provider",
        message: `Your provider cancelled the booking for ${booking.date}. Reason: ${reason || "No reason provided"}.`,
        type: "warning",
        relatedId: booking._id
      });
    }

    return booking;
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

  // --- OTP VERIFICATION SYSTEM ---

  private generateOtp(): string {
    return Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit OTP
  }

  async generateArrivalOtp(bookingId: string, providerUserId: string): Promise<IBooking> {
    const booking = await Booking.findById(bookingId).populate("providerId").populate("userId");
    if (!booking) throw new NotFoundError("Booking not found");
    
    // Verify provider owns this booking
    if ((booking as any).providerId.userId.toString() !== providerUserId) {
      throw new BadRequestError("Unauthorized: You are not the provider for this booking");
    }

    if (booking.status !== "confirmed") {
      throw new BadRequestError("Booking must be confirmed to mark arrival");
    }

    booking.arrivalOtp = this.generateOtp();
    await booking.save();

    const customer = booking.userId as any;
    const provider = booking.providerId as any;

    // Send Notification
    await Notification.create({
      userId: customer._id,
      title: "Provider Arrived",
      message: `Your provider has arrived! Your Arrival OTP is ${booking.arrivalOtp}.`,
      type: "otp",
      relatedId: booking._id
    });

    // Send Email
    if (customer.email) {
      await mailer.sendBookingOTP(
        customer.email,
        "Provider Arrived - Verification Code",
        `Your service provider has arrived at the location.`,
        booking.arrivalOtp
      );
    }

    return booking;
  }

  async verifyArrivalOtp(bookingId: string, providerUserId: string, otp: string): Promise<IBooking> {
    const booking = await Booking.findById(bookingId).populate("providerId");
    if (!booking) throw new NotFoundError("Booking not found");
    
    if ((booking as any).providerId.userId.toString() !== providerUserId) {
      throw new BadRequestError("Unauthorized");
    }

    if (booking.status !== "confirmed") {
      throw new BadRequestError("Booking is not in confirmed state");
    }

    if (!booking.arrivalOtp || booking.arrivalOtp !== otp) {
      throw new BadRequestError("Invalid Arrival OTP");
    }

    booking.status = "in_progress";
    booking.arrivalOtp = undefined; // Clear OTP after use
    return await booking.save();
  }

  async generateCompletionOtp(bookingId: string, providerUserId: string, invoiceData: { baseCharge: number, extraCharges: any[] }): Promise<IBooking> {
    const booking = await Booking.findById(bookingId).populate("providerId").populate("userId");
    if (!booking) throw new NotFoundError("Booking not found");
    
    if ((booking as any).providerId.userId.toString() !== providerUserId) {
      throw new BadRequestError("Unauthorized");
    }

    if (booking.status !== "in_progress") {
      throw new BadRequestError("Booking must be in progress to complete");
    }

    if (!invoiceData.baseCharge || invoiceData.baseCharge <= 0) {
      throw new BadRequestError("Base charge is required");
    }

    const totalExtra = invoiceData.extraCharges?.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) || 0;
    const finalTotal = Number(invoiceData.baseCharge) + totalExtra;

    booking.finalInvoice = invoiceData;
    booking.totalAmount = finalTotal;
    booking.completionOtp = this.generateOtp();

    await booking.save();

    const customer = booking.userId as any;

    // Send Notification
    await Notification.create({
      userId: customer._id,
      title: "Job Completed - Final Invoice",
      message: `The provider has marked the job as complete. Total: ₹${finalTotal}. Your Completion OTP is ${booking.completionOtp}.`,
      type: "otp",
      relatedId: booking._id
    });

    // Send Email
    if (customer.email) {
      await mailer.sendBookingOTP(
        customer.email,
        "Job Completed - Verification Code",
        `Your service provider has completed the job. The final invoice amount is ₹${finalTotal}.`,
        booking.completionOtp
      );
    }

    return booking;
  }

  async verifyCompletionOtp(bookingId: string, providerUserId: string, otp: string): Promise<IBooking> {
    const booking = await Booking.findById(bookingId).populate("providerId");
    if (!booking) throw new NotFoundError("Booking not found");
    
    if ((booking as any).providerId.userId.toString() !== providerUserId) {
      throw new BadRequestError("Unauthorized");
    }

    if (booking.status !== "in_progress") {
      throw new BadRequestError("Booking is not in progress");
    }

    if (!booking.completionOtp || booking.completionOtp !== otp) {
      throw new BadRequestError("Invalid Completion OTP");
    }

    booking.status = "completed_pending_payment";
    booking.completionOtp = undefined; // Clear OTP
    return await booking.save();
  }
}
