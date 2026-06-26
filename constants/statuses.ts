export const REVIEWABLE_BOOKING_STATUSES = [
  "completed",
  "completed_pending_payment",
] as const;

export type ReviewableBookingStatus = typeof REVIEWABLE_BOOKING_STATUSES[number];

export const UPCOMING_BOOKING_STATUSES = [
  "pending",
  "awaiting_payment",
  "confirmed",
  "in_progress",
  "completed_pending_payment",
] as const;

export const ACTIVE_PROVIDER_BOOKING_STATUSES = [
  "confirmed",
  "in_progress",
  "completed_pending_payment",
] as const;

export const COMPLETED_BOOKING_STATUS = "completed" as const;

export const ACTIVE_SLOT_BOOKING_STATUSES = ["pending", "confirmed"] as const;

export const CANCELLABLE_BOOKING_STATUSES = [
  "pending",
  "awaiting_payment",
  "confirmed",
  "in_progress",
  "completed_pending_payment",
  "rescheduled",
] as const;