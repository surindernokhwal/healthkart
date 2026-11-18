"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { logActivity } from "@/lib/activity";
import { bookingCode, canModify, getFreeSlots, slotKey } from "@/lib/slots";
import { dateOnly } from "@/lib/time";
import { formatDate, formatTime, toId } from "@/lib/format";
import { sendBookingEmail, sendCancellationEmail, sendRescheduleEmail } from "@/lib/mailer";
import { bookingSchema, changePasswordSchema, fieldErrors, profileSchema } from "@/lib/validation";

const emailInclude = {
  patient: { include: { user: true } },
  doctor: { include: { user: true, department: true } },
};

// ---------- Book / reschedule (FR-14, FR-15, FR-19) ----------

export async function bookAppointment(prevState, formData) {
  const user = await requireRole("PATIENT");
  const parsed = bookingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: Object.values(fieldErrors(parsed))[0] };
  const { doctorId, date, timeSlot, reason, rescheduleId } = parsed.data;

  // Server-side validation: the slot must still be generated and free
  const { slots } = await getFreeSlots(doctorId, date);
  if (!slots.includes(timeSlot)) {
    revalidatePath("/patient/book"); // refresh the slot list on screen
    return { error: "Sorry, this slot is no longer available. Please choose another slot." };
  }

  let old = null;
  if (rescheduleId) {
    old = await prisma.appointment.findUnique({ where: { id: rescheduleId }, include: emailInclude });
    if (!old || old.patientId !== user.patient.id) return { error: "Appointment not found" };
    if (old.doctorId !== doctorId) return { error: "You can only reschedule with the same doctor" };
    if (!canModify(old)) return { error: "Appointments can only be rescheduled more than 2 hours before the slot" };
  }

  const newData = {
    bookingCode: bookingCode(),
    patientId: user.patient.id,
    doctorId,
    date: dateOnly(date),
    timeSlot,
    reason: reason || (old?.reason ?? null),
    activeSlot: slotKey(doctorId, date, timeSlot),
  };

  let created;
  try {
    if (old) {
      // Cancel the old appointment and book the new one atomically
      [, created] = await prisma.$transaction([
        prisma.appointment.update({ where: { id: old.id }, data: { status: "CANCELLED", activeSlot: null } }),
        prisma.appointment.create({ data: newData, include: emailInclude }),
      ]);
    } else {
      created = await prisma.appointment.create({ data: newData, include: emailInclude });
    }
  } catch (err) {
    // The unique key on the active slot rejects a slot taken at the same moment
    if (err.code === "P2002") {
      revalidatePath("/patient/book");
      return { error: "Sorry, another patient just booked this slot. Please choose another slot." };
    }
    throw err;
  }

  if (old) {
    await sendRescheduleEmail(old, created);
    await logActivity(user.id, "RESCHEDULE", `${old.bookingCode} -> ${created.bookingCode}`);
  } else {
    await sendBookingEmail(created);
    await logActivity(user.id, "BOOKING", created.bookingCode);
  }

  revalidatePath("/patient");
  redirect(`/patient/appointments?booked=${created.bookingCode}`);
}

export async function cancelAppointment(prevState, formData) {
  const user = await requireRole("PATIENT");
  const id = toId(formData.get("id"));
  const appt = await prisma.appointment.findUnique({ where: { id }, include: emailInclude });
  if (!appt || appt.patientId !== user.patient.id) return { error: "Appointment not found" };
  if (!canModify(appt)) return { error: "Appointments can only be cancelled more than 2 hours before the slot" };

  await prisma.appointment.update({ where: { id }, data: { status: "CANCELLED", activeSlot: null } });
  await sendCancellationEmail(appt);
  await logActivity(user.id, "CANCEL", appt.bookingCode);
  revalidatePath("/patient");
  revalidatePath("/patient/appointments");
  return {
    success: `Appointment ${appt.bookingCode} on ${formatDate(appt.date)} at ${formatTime(appt.timeSlot)} cancelled`,
  };
}

// ---------- Profile (FR-17) ----------

export async function updateProfile(prevState, formData) {
  const user = await requireRole("PATIENT");
  const data = Object.fromEntries(formData);
  const parsed = profileSchema.safeParse(data);
  if (!parsed.success) return { errors: fieldErrors(parsed) };

  const { name, phone, gender, dob, address } = parsed.data;
  await prisma.user.update({
    where: { id: user.id },
    data: { name, patient: { update: { phone, gender, dob: dateOnly(dob), address: address || null } } },
  });
  await logActivity(user.id, "PROFILE_UPDATE");
  revalidatePath("/patient/profile");
  return { success: "Profile updated" };
}

export async function changePassword(prevState, formData) {
  const user = await requireRole("PATIENT", "DOCTOR", "ADMIN");
  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed) };

  const ok = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!ok) return { errors: { currentPassword: "Current password is incorrect" } };

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 10) },
  });
  await logActivity(user.id, "PASSWORD_CHANGE");
  return { success: "Password changed", reset: true };
}
