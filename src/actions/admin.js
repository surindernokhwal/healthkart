"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { logActivity } from "@/lib/activity";
import { toId } from "@/lib/format";
import { sendCancellationEmail } from "@/lib/mailer";
import {
  departmentSchema,
  doctorCreateSchema,
  doctorUpdateSchema,
  fieldErrors,
  markPaidSchema,
} from "@/lib/validation";

// ---------- Departments (FR-02) ----------

export async function saveDepartment(prevState, formData) {
  const admin = await requireRole("ADMIN");
  const data = Object.fromEntries(formData);
  const parsed = departmentSchema.safeParse(data);
  if (!parsed.success) return { errors: fieldErrors(parsed), values: data };

  const id = toId(data.id) || null;
  const payload = { name: parsed.data.name, description: parsed.data.description || null };
  try {
    if (id) await prisma.department.update({ where: { id }, data: payload });
    else await prisma.department.create({ data: payload });
  } catch (err) {
    if (err.code === "P2002") return { errors: { name: "A department with this name already exists" }, values: data };
    throw err;
  }
  await logActivity(admin.id, id ? "DEPARTMENT_UPDATE" : "DEPARTMENT_CREATE", payload.name);
  revalidatePath("/admin/departments");
  return { success: id ? "Department updated" : "Department added", reset: !id };
}

export async function toggleDepartment(formData) {
  const admin = await requireRole("ADMIN");
  const id = toId(formData.get("id"));
  const dept = await prisma.department.findUnique({ where: { id } });
  if (!dept) return;
  await prisma.department.update({ where: { id }, data: { isActive: !dept.isActive } });
  await logActivity(admin.id, dept.isActive ? "DEPARTMENT_DEACTIVATE" : "DEPARTMENT_ACTIVATE", dept.name);
  revalidatePath("/admin/departments");
}

// ---------- Doctors (FR-03) ----------

export async function createDoctor(prevState, formData) {
  const admin = await requireRole("ADMIN");
  const data = Object.fromEntries(formData);
  const { password, ...values } = data;
  const parsed = doctorCreateSchema.safeParse(data);
  if (!parsed.success) return { errors: fieldErrors(parsed), values };

  const { name, email, departmentId, qualification, phone, fee } = parsed.data;
  if (await prisma.user.findUnique({ where: { email } })) {
    return { errors: { email: "This email is already registered" }, values };
  }
  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  // users + doctors records in one transaction (nested create)
  try {
    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "DOCTOR",
        doctor: { create: { departmentId, qualification, phone, fee } },
      },
    });
  } catch (err) {
    if (err.code === "P2002") return { errors: { email: "This email is already registered" }, values };
    if (err.code === "P2003") return { errors: { departmentId: "Select a valid department" }, values };
    throw err;
  }
  await logActivity(admin.id, "DOCTOR_CREATE", `Dr. ${name} <${email}>`);
  revalidatePath("/admin/doctors");
  redirect("/admin/doctors");
}

export async function updateDoctor(prevState, formData) {
  const admin = await requireRole("ADMIN");
  const data = Object.fromEntries(formData);
  const id = toId(data.id);
  const parsed = doctorUpdateSchema.safeParse(data);
  if (!parsed.success) return { errors: fieldErrors(parsed), values: data };

  const { name, departmentId, qualification, phone, fee } = parsed.data;
  const doctor = await prisma.doctor.findUnique({ where: { id } });
  if (!doctor) return { error: "Doctor not found" };

  await prisma.doctor.update({
    where: { id },
    data: { departmentId, qualification, phone, fee, user: { update: { name } } },
  });
  await logActivity(admin.id, "DOCTOR_UPDATE", `Dr. ${name}`);
  revalidatePath("/admin/doctors");
  redirect("/admin/doctors");
}

// Deactivating hides the doctor from booking without deleting history.
export async function toggleDoctor(formData) {
  const admin = await requireRole("ADMIN");
  const id = toId(formData.get("id"));
  const doctor = await prisma.doctor.findUnique({ where: { id }, include: { user: true } });
  if (!doctor) return;
  await prisma.user.update({ where: { id: doctor.userId }, data: { isActive: !doctor.user.isActive } });
  await logActivity(admin.id, doctor.user.isActive ? "DOCTOR_DEACTIVATE" : "DOCTOR_ACTIVATE", `Dr. ${doctor.user.name}`);
  revalidatePath("/admin/doctors");
}

// ---------- Billing (FR-05) ----------

export async function markBillPaid(prevState, formData) {
  const admin = await requireRole("ADMIN");
  const parsed = markPaidSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: Object.values(fieldErrors(parsed))[0] };

  const { billId, mode } = parsed.data;
  // Only a PENDING bill can be marked paid (prevents double payment)
  const { count } = await prisma.bill.updateMany({
    where: { id: billId, status: "PENDING" },
    data: { status: "PAID", mode, paidAt: new Date() },
  });
  if (!count) return { error: "Bill is already paid or does not exist" };

  await logActivity(admin.id, "PAYMENT", `Bill #${billId} paid by ${mode}`);
  revalidatePath("/admin/bills");
  revalidatePath("/admin");
  return { success: "Payment recorded" };
}

// ---------- Clinic-side cancellation (e.g. doctor unavailable) ----------

export async function adminCancelAppointment(formData) {
  const admin = await requireRole("ADMIN");
  const id = toId(formData.get("id"));
  const appt = await prisma.appointment.findUnique({
    where: { id },
    include: { patient: { include: { user: true } }, doctor: { include: { user: true, department: true } } },
  });
  if (!appt || appt.status !== "CONFIRMED") return;

  await prisma.appointment.update({ where: { id }, data: { status: "CANCELLED", activeSlot: null } });
  await sendCancellationEmail(appt);
  await logActivity(admin.id, "CANCEL", `${appt.bookingCode} (by clinic)`);
  revalidatePath("/admin/appointments");
}
