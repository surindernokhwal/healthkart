import { randomInt } from "crypto";
import { prisma } from "./prisma";
import {
  addDays,
  dateOnly,
  isValidDateStr,
  minutesToTime,
  slotInstant,
  timeToMinutes,
  todayIST,
  weekdayOf,
} from "./time";

export const MAX_ADVANCE_DAYS = 30;
export const CANCEL_CUTOFF_HOURS = 2;

// Step 3 of the slot booking algorithm:
// t = start_time; while t + slot_minutes <= end_time, add t and advance.
export function generateSlots(startTime, endTime, slotMinutes) {
  const slots = [];
  const end = timeToMinutes(endTime);
  for (let t = timeToMinutes(startTime); t + slotMinutes <= end; t += slotMinutes) {
    slots.push(minutesToTime(t));
  }
  return slots;
}

// Key for the unique "active slot" column (see schema.prisma).
export function slotKey(doctorId, dateStr, time) {
  return `${doctorId}|${dateStr}|${time}`;
}

// Booking ID shown to the patient, e.g. "CL7K2M9QXA" (10 chars).
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function bookingCode() {
  let code = "CL";
  for (let i = 0; i < 8; i++) code += CODE_CHARS[randomInt(CODE_CHARS.length)];
  return code;
}

// Cancel/reschedule is allowed only more than 2 hours before the slot.
export function canModify(appt) {
  const dateStr = appt.date instanceof Date ? appt.date.toISOString().slice(0, 10) : appt.date;
  return (
    appt.status === "CONFIRMED" &&
    slotInstant(dateStr, appt.timeSlot).getTime() - Date.now() > CANCEL_CUTOFF_HOURS * 3600_000
  );
}

// Free slots of a doctor on a date (FR-13, FR-18).
// Returns { slots: ["10:00", ...] } or { message: "No slots available ..." }.
export async function getFreeSlots(doctorId, dateStr) {
  const today = todayIST();
  if (!isValidDateStr(dateStr)) return { slots: [], message: "Invalid date." };
  if (dateStr < today || dateStr > addDays(today, MAX_ADVANCE_DAYS)) {
    return { slots: [], message: `Choose a date between today and ${MAX_ADVANCE_DAYS} days ahead.` };
  }

  // Both queries run at the same time (the database is a network round trip away)
  const [doctor, booked] = await Promise.all([
    prisma.doctor.findUnique({
      where: { id: Number(doctorId) },
      include: {
        user: true,
        department: true,
        schedules: { where: { weekday: weekdayOf(dateStr) } },
        leaves: { where: { leaveDate: dateOnly(dateStr) } },
      },
    }),
    prisma.appointment.findMany({
      where: { doctorId: Number(doctorId), date: dateOnly(dateStr), status: { not: "CANCELLED" } },
      select: { timeSlot: true },
    }),
  ]);
  if (!doctor || !doctor.user.isActive || !doctor.department.isActive) {
    return { slots: [], message: "This doctor is not available for booking." };
  }

  // Step 2: leave date or non-working weekday
  if (doctor.leaves.length) return { slots: [], message: "No slots available: the doctor is on leave that day." };
  const schedule = doctor.schedules[0];
  if (!schedule) return { slots: [], message: "No slots available: the doctor does not work on this day." };

  // Step 3: generate all slots
  const all = generateSlots(schedule.startTime, schedule.endTime, schedule.slotMinutes);

  // Step 4: booked times in a Set for O(1) lookup; drop booked and past slots
  const bookedSet = new Set(booked.map((b) => b.timeSlot));
  const now = Date.now();
  const slots = all.filter((t) => !bookedSet.has(t) && slotInstant(dateStr, t).getTime() > now);

  return slots.length ? { slots } : { slots: [], message: "No slots available: all slots are booked or over." };
}
