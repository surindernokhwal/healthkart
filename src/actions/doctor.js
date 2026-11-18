"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { logActivity } from "@/lib/activity";
import { toId } from "@/lib/format";
import { dateOnly, toDateStr, todayIST } from "@/lib/time";
import {
  fieldErrors,
  leaveSchema,
  prescriptionSchema,
  readPrescriptionForm,
  readScheduleForm,
} from "@/lib/validation";

// ---------- Weekly availability (FR-07) ----------

export async function saveSchedule(prevState, formData) {
  const user = await requireRole("DOCTOR");
  const doctorId = user.doctor.id;

  // Same Zod check as in the browser (lib/validation.js), repeated on the server
  const { days, errors } = readScheduleForm(formData);
  if (Object.keys(errors).length) return { errors };

  await prisma.$transaction([
    prisma.doctorSchedule.deleteMany({
      where: { doctorId, weekday: { notIn: days.map((d) => d.weekday) } },
    }),
    ...days.map((d) =>
      prisma.doctorSchedule.upsert({
        where: { doctorId_weekday: { doctorId, weekday: d.weekday } },
        update: { startTime: d.startTime, endTime: d.endTime, slotMinutes: d.slotMinutes },
        create: { doctorId, ...d },
      })
    ),
  ]);
  await logActivity(user.id, "SCHEDULE_UPDATE", `${days.length} working days`);
  revalidatePath("/doctor/schedule");
  return { success: "Schedule saved" };
}

// ---------- Leave dates (FR-08) ----------

export async function addLeave(prevState, formData) {
  const user = await requireRole("DOCTOR");
  const doctorId = user.doctor.id;
  const parsed = leaveSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed) };

  const { leaveDate, reason } = parsed.data;
  const booked = await prisma.appointment.count({
    where: { doctorId, date: dateOnly(leaveDate), status: "CONFIRMED" },
  });
  if (booked) {
    return {
      errors: {
        leaveDate: `You have ${booked} confirmed appointment(s) on this date. Ask the clinic admin to cancel them first.`,
      },
    };
  }

  try {
    await prisma.doctorLeave.create({ data: { doctorId, leaveDate: dateOnly(leaveDate), reason: reason || null } });
  } catch (err) {
    if (err.code === "P2002") return { errors: { leaveDate: "This date is already marked as leave" } };
    throw err;
  }
  await logActivity(user.id, "LEAVE_ADD", leaveDate);
  revalidatePath("/doctor/schedule");
  return { success: "Leave added", reset: true };
}

export async function deleteLeave(formData) {
  const user = await requireRole("DOCTOR");
  await prisma.doctorLeave.deleteMany({
    where: { id: toId(formData.get("id")), doctorId: user.doctor.id },
  });
  revalidatePath("/doctor/schedule");
}

// ---------- Consultation & prescription (FR-11, FR-20) ----------

export async function savePrescription(prevState, formData) {
  const user = await requireRole("DOCTOR");

  const parsed = prescriptionSchema.safeParse(readPrescriptionForm(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed) };
  const { appointmentId, diagnosis, advice } = parsed.data;

  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { doctor: true },
  });
  if (!appt || appt.doctorId !== user.doctor.id) return { error: "Appointment not found" };
  if (appt.status !== "CONFIRMED") return { error: "This appointment is not open for consultation" };
  if (toDateStr(appt.date) > todayIST()) return { error: "You can complete this consultation on the appointment date" };

  // Prescription + items + COMPLETED status + bill, all in one transaction
  await prisma.$transaction(async (tx) => {
    const itemRows = [];
    for (const item of parsed.data.items) {
      const existing = await tx.medicine.findFirst({
        where: { name: { equals: item.medicine, mode: "insensitive" } },
      });
      const medicine = existing ?? (await tx.medicine.create({ data: { name: item.medicine, type: item.type } }));
      itemRows.push({ medicineId: medicine.id, dosage: item.dosage, durationDays: item.durationDays });
    }

    await tx.prescription.create({
      data: { appointmentId, diagnosis, advice: advice || null, items: { create: itemRows } },
    });
    await tx.appointment.update({ where: { id: appointmentId }, data: { status: "COMPLETED" } });
    // M6: bill generated automatically from the consultation fee
    await tx.bill.create({ data: { appointmentId, amount: appt.doctor.fee } });
  });

  await logActivity(user.id, "CONSULTATION_COMPLETE", `Appointment ${appt.bookingCode}`);
  revalidatePath("/doctor");
  redirect(`/doctor/appointments/${appointmentId}`);
}
