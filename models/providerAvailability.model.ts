import mongoose, { Schema } from "mongoose";
import { IProviderAvailability } from "../types/providerProfile.types";

const TimeSlotSchema = new Schema({
  id: { type: String, required: true },
  start: { type: String, required: true },
  end: { type: String, required: true },
  startDate: { type: String, required: false },
  endDate: { type: String, required: false },
  rrule: { type: String, required: false }
}, { _id: false });

const DayScheduleSchema = new Schema({
  isAvailable: { type: Boolean, default: false },
  slots: { type: [TimeSlotSchema], default: [] }
}, { _id: false });

const DateOverrideSchema = new Schema({
  id: { type: String, required: true },
  date: { type: String, required: true },
  isAvailable: { type: Boolean, required: true },
  slots: { type: [TimeSlotSchema], default: [] }
}, { _id: false });

const ProviderAvailabilitySchema = new Schema({
  providerId: { type: Schema.Types.ObjectId, ref: "ProviderProfile", required: true, unique: true },
  startDate: { type: String, required: false },
  endDate: { type: String, required: false },  
  weeklySchedule: {
    Monday: { type: DayScheduleSchema, default: { isAvailable: false, slots: [] } },
    Tuesday: { type: DayScheduleSchema, default: { isAvailable: false, slots: [] } },
    Wednesday: { type: DayScheduleSchema, default: { isAvailable: false, slots: [] } },
    Thursday: { type: DayScheduleSchema, default: { isAvailable: false, slots: [] } },
    Friday: { type: DayScheduleSchema, default: { isAvailable: false, slots: [] } },
    Saturday: { type: DayScheduleSchema, default: { isAvailable: false, slots: [] } },
    Sunday: { type: DayScheduleSchema, default: { isAvailable: false, slots: [] } }
  },
  overrides: { type: [DateOverrideSchema], default: [] }
}, { timestamps: true });

export default mongoose.model<IProviderAvailability>("ProviderAvailability", ProviderAvailabilitySchema);
