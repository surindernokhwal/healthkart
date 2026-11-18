import { prisma } from "./prisma";

// Ownership checks for printable records (security level 2):
// admin sees everything, a patient sees only their own records, a doctor sees
// records of patients they have treated or are treating.
export async function canViewAppointment(user, appt) {
  if (user.role === "ADMIN") return true;
  if (user.role === "PATIENT") return appt.patientId === user.patient?.id;
  if (user.role === "DOCTOR") {
    if (appt.doctorId === user.doctor?.id) return true;
    const treated = await prisma.appointment.count({
      where: { doctorId: user.doctor?.id, patientId: appt.patientId, status: { not: "CANCELLED" } },
    });
    return treated > 0;
  }
  return false;
}
