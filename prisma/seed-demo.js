// Demo history: past visits, prescriptions, bills (paid and pending),
// cancelled bookings and upcoming appointments, so the dashboards, reports
// and charts have realistic data for demonstrations and screenshots.
//
// Run after the main seed:  npm run db:demo
// Safe to run more than once: every demo booking ID starts with "CLDEMO" and
// existing ones are skipped. Dates are relative to today, so the data always
// looks recent. Normal booking rules (free slots, 2-hour rule) are bypassed
// on purpose because past visits cannot be booked through the app.

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

// ---------- dates in Indian Standard Time ----------
const istToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
const addDays = (d, n) => {
  const x = new Date(`${d}T00:00:00Z`);
  x.setUTCDate(x.getUTCDate() + n);
  return x.toISOString().slice(0, 10);
};
const weekday = (d) => new Date(`${d}T00:00:00Z`).getUTCDay();
const dateOnly = (d) => new Date(`${d}T00:00:00.000Z`);
const instant = (d, t) => new Date(`${d}T${t}:00+05:30`);

// The working day of a doctor nearest to `offset` days from today
function workday(schedDays, offset) {
  const step = offset < 0 ? -1 : 1;
  let d = addDays(istToday(), offset);
  while (!schedDays.includes(weekday(d))) d = addDays(d, step);
  return d;
}

const DEMO_PATIENTS = [
  {
    name: "Ritu Bisht",
    email: "ritu.demo@clinic.com",
    phone: "9876500011",
    gender: "Female",
    dob: "1992-04-18",
    address: "Ballupur, Dehradun",
  },
  {
    name: "Aman Rawat",
    email: "aman.demo@clinic.com",
    phone: "9876500012",
    gender: "Male",
    dob: "2017-09-02",
    address: "Prem Nagar, Dehradun",
  },
];

// offset: days from today (negative = past). status COMPLETED needs rx + bill.
const VISITS = [
  {
    code: "CLDEMO000001", patient: "patient@clinic.com", doctor: "anil.sharma@clinic.com", offset: -20, time: "10:15",
    status: "COMPLETED", reason: "Fever and body ache for 2 days",
    rx: {
      diagnosis: "Viral fever",
      advice: "Drink plenty of fluids and rest for 3 days. Come back if the fever lasts more than 3 days.",
      items: [["Paracetamol 650mg", "1-0-1 after food", 5], ["Cetirizine 10mg", "0-0-1 at night", 5]],
    },
    bill: { status: "PAID", mode: "CASH" },
  },
  {
    code: "CLDEMO000002", patient: "ritu.demo@clinic.com", doctor: "anil.sharma@clinic.com", offset: -15, time: "10:30",
    status: "COMPLETED", reason: "BP check-up",
    rx: {
      diagnosis: "Essential hypertension (follow-up), BP 142/90",
      advice: "Reduce salt, walk 30 minutes daily. Check BP weekly.",
      items: [["Amlodipine 5mg", "1-0-0 before breakfast", 30]],
    },
    bill: { status: "PAID", mode: "UPI" },
  },
  {
    code: "CLDEMO000003", patient: "patient@clinic.com", doctor: "rohit.negi@clinic.com", offset: -12, time: "11:30",
    status: "COMPLETED", reason: "Tooth pain, lower left side",
    rx: {
      diagnosis: "Dental caries, lower left first molar",
      advice: "Filling planned at next visit. Avoid very cold and sweet food.",
      items: [["Ibuprofen 400mg", "1 tablet if pain (max 3 a day)", 3], ["Chlorhexidine Mouthwash", "Rinse twice daily", 7]],
    },
    bill: { status: "PAID", mode: "UPI" },
  },
  {
    code: "CLDEMO000004", patient: "aman.demo@clinic.com", doctor: "priya.rawat@clinic.com", offset: -10, time: "16:20",
    status: "COMPLETED", reason: "Cough and cold for a week",
    rx: {
      diagnosis: "Acute bronchitis",
      advice: "Steam inhalation twice daily. Warm fluids. Review after 5 days.",
      items: [["Paracetamol Syrup 250mg/5ml", "5 ml three times a day", 3], ["Cough Syrup (Dextromethorphan)", "5 ml at night", 5]],
    },
    bill: { status: "PAID", mode: "CASH" },
  },
  {
    code: "CLDEMO000005", patient: "patient@clinic.com", doctor: "anil.sharma@clinic.com", offset: -9, time: "11:00",
    status: "CANCELLED", reason: "Follow-up visit",
  },
  {
    code: "CLDEMO000006", patient: "patient@clinic.com", doctor: "meena.joshi@clinic.com", offset: -6, time: "09:45",
    status: "COMPLETED", reason: "Lower back pain after lifting",
    rx: {
      diagnosis: "Acute lumbar muscle strain",
      advice: "Avoid lifting heavy weights for 2 weeks. Hot fomentation twice daily.",
      items: [["Diclofenac Gel", "Apply on the back twice daily", 7], ["Calcium + Vitamin D3", "0-0-1 after dinner", 30]],
    },
    bill: { status: "PENDING" },
  },
  {
    code: "CLDEMO000007", patient: "ritu.demo@clinic.com", doctor: "meena.joshi@clinic.com", offset: -3, time: "10:00",
    status: "COMPLETED", reason: "Knee pain while climbing stairs",
    rx: {
      diagnosis: "Early osteoarthritis, right knee",
      advice: "Knee strengthening exercises daily. Reduce weight. Review after 1 month.",
      items: [["Calcium + Vitamin D3", "0-0-1 after dinner", 30], ["Diclofenac Gel", "Apply on the knee twice daily", 10]],
    },
    bill: { status: "PENDING" },
  },
  {
    code: "CLDEMO000008", patient: "aman.demo@clinic.com", doctor: "priya.rawat@clinic.com", offset: -2, time: "17:00",
    status: "CANCELLED", reason: "Vaccination",
  },
  // Today: open for consultation by the doctor
  {
    code: "CLDEMO000009", patient: "patient@clinic.com", doctor: "anil.sharma@clinic.com", offset: 0, time: "10:30",
    status: "CONFIRMED", reason: "Follow-up for fever, mild cough",
  },
  {
    code: "CLDEMO000010", patient: "ritu.demo@clinic.com", doctor: "rohit.negi@clinic.com", offset: 0, time: "15:00",
    status: "CONFIRMED", reason: "Teeth cleaning",
  },
  // Upcoming
  {
    code: "CLDEMO000011", patient: "ritu.demo@clinic.com", doctor: "anil.sharma@clinic.com", offset: 2, time: "11:00",
    status: "CONFIRMED", reason: "BP follow-up",
  },
  {
    code: "CLDEMO000012", patient: "aman.demo@clinic.com", doctor: "priya.rawat@clinic.com", offset: 3, time: "16:40",
    status: "CONFIRMED", reason: "Vaccination (rescheduled)",
  },
];

async function main() {
  // Demo patients (password Patient@123, like the main demo patient)
  const hash = await bcrypt.hash("Patient@123", 10);
  for (const p of DEMO_PATIENTS) {
    await prisma.user.upsert({
      where: { email: p.email },
      update: {},
      create: {
        name: p.name,
        email: p.email,
        role: "PATIENT",
        passwordHash: hash,
        patient: { create: { phone: p.phone, gender: p.gender, dob: dateOnly(p.dob), address: p.address } },
      },
    });
  }

  const users = await prisma.user.findMany({ include: { patient: true, doctor: { include: { schedules: true } } } });
  const byEmail = new Map(users.map((u) => [u.email, u]));
  const medicines = new Map((await prisma.medicine.findMany()).map((m) => [m.name, m.id]));

  let created = 0;
  for (const v of VISITS) {
    if (await prisma.appointment.findUnique({ where: { bookingCode: v.code } })) continue;

    const patient = byEmail.get(v.patient)?.patient;
    const doctorUser = byEmail.get(v.doctor);
    if (!patient || !doctorUser?.doctor) throw new Error(`Run "npm run db:seed" first (missing ${v.patient} or ${v.doctor})`);
    const doctor = doctorUser.doctor;

    const days = doctor.schedules.map((s) => s.weekday);
    if (!days.length) continue; // doctor has no schedule
    const date = v.offset === 0 ? istToday() : workday(days, v.offset);
    const visitAt = instant(date, v.time);
    const active = v.status === "CANCELLED" ? null : `${doctor.id}|${date}|${v.time}`;

    // Skip if a real booking already uses this slot
    if (active && (await prisma.appointment.findUnique({ where: { activeSlot: active } }))) continue;

    await prisma.$transaction(async (tx) => {
      const appt = await tx.appointment.create({
        data: {
          bookingCode: v.code,
          patientId: patient.id,
          doctorId: doctor.id,
          date: dateOnly(date),
          timeSlot: v.time,
          status: v.status,
          reason: v.reason,
          activeSlot: active,
          createdAt: new Date(visitAt.getTime() - 3 * 86400000),
        },
      });
      if (v.rx) {
        await tx.prescription.create({
          data: {
            appointmentId: appt.id,
            diagnosis: v.rx.diagnosis,
            advice: v.rx.advice,
            createdAt: new Date(visitAt.getTime() + 15 * 60000),
            items: {
              create: v.rx.items.map(([name, dosage, durationDays]) => {
                if (!medicines.has(name)) throw new Error(`Medicine not found: ${name}`);
                return { medicineId: medicines.get(name), dosage, durationDays };
              }),
            },
          },
        });
      }
      if (v.bill) {
        const billDate = new Date(visitAt.getTime() + 15 * 60000);
        await tx.bill.create({
          data: {
            appointmentId: appt.id,
            amount: doctor.fee,
            status: v.bill.status,
            mode: v.bill.mode ?? null,
            billDate,
            paidAt: v.bill.status === "PAID" ? new Date(billDate.getTime() + 10 * 60000) : null,
          },
        });
      }
    });
    created++;
  }

  console.log(`Demo history ready: ${created} new appointments (${VISITS.length - created} already existed or skipped).`);
  console.log("Extra demo patients: ritu.demo@clinic.com, aman.demo@clinic.com (password Patient@123)");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
