import { z } from "zod";
import { isValidDateStr, todayIST } from "./time";

// Zod schemas shared by client forms and server actions.

const name = z.string().trim().min(2, "Name is too short").max(100);
const email = z.string().trim().toLowerCase().email("Enter a valid email").max(120);
const phone = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number");
const dateStr = z.string().refine(isValidDateStr, "Enter a valid date");
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Enter a valid time");
const id = z.coerce.number().int().positive().max(2147483647);

export const strongPassword = z
  .string()
  .min(8, "At least 8 characters")
  .max(72, "At most 72 characters")
  .regex(/[a-z]/, "Must contain a lowercase letter")
  .regex(/[A-Z]/, "Must contain an uppercase letter")
  .regex(/\d/, "Must contain a digit");

export const GENDERS = ["Male", "Female", "Other"];
export const MEDICINE_TYPES = ["Tablet", "Capsule", "Syrup", "Injection", "Ointment", "Drops", "Other"];

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password").max(72),
});

const patientProfile = {
  name,
  phone,
  gender: z.enum(GENDERS, { message: "Select a gender" }),
  dob: dateStr.refine((d) => d < todayIST() && d > "1900-01-01", "Enter a valid date of birth"),
  address: z.string().trim().max(500).optional().default(""),
};

export const registerSchema = z
  .object({ ...patientProfile, email, password: strongPassword, confirmPassword: z.string() })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const profileSchema = z.object(patientProfile);

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: strongPassword,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const departmentSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80),
  description: z.string().trim().max(500).optional().default(""),
});

const doctorFields = {
  name,
  departmentId: id,
  qualification: z.string().trim().min(2, "Enter the qualification").max(100),
  phone,
  fee: z.coerce.number({ message: "Enter the fee" }).min(0).max(100000),
};

export const doctorCreateSchema = z.object({ ...doctorFields, email, password: strongPassword });
export const doctorUpdateSchema = z.object(doctorFields);

export const scheduleDaySchema = z
  .object({
    weekday: z.number().int().min(0).max(6),
    startTime: time,
    endTime: time,
    slotMinutes: z.coerce.number().int().min(10, "Slot: 10-60 minutes").max(60, "Slot: 10-60 minutes"),
  })
  .refine((d) => d.endTime > d.startTime, { message: "End time must be after start time", path: ["endTime"] })
  .refine(
    (d) => {
      const [sh, sm] = d.startTime.split(":").map(Number);
      const [eh, em] = d.endTime.split(":").map(Number);
      return eh * 60 + em - (sh * 60 + sm) >= d.slotMinutes;
    },
    { message: "Slot duration does not fit the time range", path: ["slotMinutes"] }
  );

export const leaveSchema = z.object({
  leaveDate: dateStr.refine((d) => d >= todayIST(), "Leave date cannot be in the past"),
  reason: z.string().trim().max(150).optional().default(""),
});

export const bookingSchema = z.object({
  doctorId: id,
  date: dateStr,
  timeSlot: time,
  reason: z.string().trim().max(500).optional().default(""),
  rescheduleId: id.optional(),
});

export const prescriptionSchema = z.object({
  appointmentId: id,
  diagnosis: z.string().trim().min(2, "Enter the diagnosis").max(2000),
  advice: z.string().trim().max(2000).optional().default(""),
  items: z
    .array(
      z.object({
        medicine: z.string().trim().min(1, "Medicine name required").max(100),
        type: z.enum(MEDICINE_TYPES),
        dosage: z.string().trim().min(1, "Dosage required").max(50),
        durationDays: z.coerce.number().int().min(1, "Days must be 1-365").max(365, "Days must be 1-365"),
      })
    )
    .min(1, "Add at least one medicine")
    .max(20),
});

export const markPaidSchema = z.object({
  billId: id,
  mode: z.enum(["CASH", "UPI"], { message: "Select payment mode" }),
});

// Convert a failed safeParse into { field: "first message" }
export function fieldErrors(result) {
  const errors = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".") || "form";
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

// ---------- Form readers shared by the browser and the server ----------
// Both sides read and validate a submitted form in exactly the same way.

// Weekly schedule form: fields works_<day>, start_<day>, end_<day>, slot_<day>.
// Returns { days: [valid days], errors: { weekday: message } }.
export function readScheduleForm(formData) {
  const days = [];
  const errors = {};
  for (let weekday = 0; weekday < 7; weekday++) {
    if (formData.get(`works_${weekday}`) !== "on") continue;
    const parsed = scheduleDaySchema.safeParse({
      weekday,
      startTime: formData.get(`start_${weekday}`),
      endTime: formData.get(`end_${weekday}`),
      slotMinutes: formData.get(`slot_${weekday}`),
    });
    if (parsed.success) days.push(parsed.data);
    else errors[weekday] = Object.values(fieldErrors(parsed))[0];
  }
  return { days, errors };
}

// Prescription form: the medicine rows travel as JSON in the "items" field
export function readPrescriptionForm(formData) {
  let items;
  try {
    items = JSON.parse(formData.get("items") || "[]");
  } catch {
    items = [];
  }
  return {
    appointmentId: formData.get("appointmentId"),
    diagnosis: formData.get("diagnosis") ?? "",
    advice: formData.get("advice") ?? "",
    items,
  };
}

// Client-side checkers: (formData) => errors object, or null when valid
export function zodCheck(schema, read = (fd) => Object.fromEntries(fd)) {
  return (formData) => {
    const result = schema.safeParse(read(formData));
    return result.success ? null : fieldErrors(result);
  };
}

export function scheduleCheck(formData) {
  const { errors } = readScheduleForm(formData);
  return Object.keys(errors).length ? errors : null;
}
