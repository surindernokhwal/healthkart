// Seed data: default admin, departments, doctors with schedules, medicines and
// a demo patient. Safe to run more than once (uses upsert).
// Run with:  npx prisma db seed

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const DEPARTMENTS = [
  { name: "General Medicine", description: "Fever, infections, BP, diabetes and general health problems" },
  { name: "Paediatrics", description: "Child health, vaccination and growth monitoring" },
  { name: "Dental", description: "Tooth pain, cleaning, fillings and root canal treatment" },
  { name: "Orthopaedics", description: "Bone, joint, back and sports injuries" },
];

// Mon-Sat (1-6) schedules
const DOCTORS = [
  {
    name: "Anil Sharma",
    email: "anil.sharma@clinic.com",
    dept: "General Medicine",
    qualification: "MBBS, MD (Medicine)",
    phone: "9876500001",
    fee: 500,
    schedule: { days: [1, 2, 3, 4, 5, 6], start: "10:00", end: "13:00", slot: 15 },
  },
  {
    name: "Priya Rawat",
    email: "priya.rawat@clinic.com",
    dept: "Paediatrics",
    qualification: "MBBS, DCH",
    phone: "9876500002",
    fee: 600,
    schedule: { days: [1, 3, 5], start: "16:00", end: "19:00", slot: 20 },
  },
  {
    name: "Rohit Negi",
    email: "rohit.negi@clinic.com",
    dept: "Dental",
    qualification: "BDS, MDS",
    phone: "9876500003",
    fee: 400,
    schedule: { days: [1, 2, 3, 4, 5, 6], start: "11:00", end: "17:00", slot: 30 },
  },
  {
    name: "Meena Joshi",
    email: "meena.joshi@clinic.com",
    dept: "Orthopaedics",
    qualification: "MBBS, MS (Ortho)",
    phone: "9876500004",
    fee: 700,
    schedule: { days: [2, 4, 6], start: "09:30", end: "12:30", slot: 15 },
  },
];

const MEDICINES = [
  ["Paracetamol 500mg", "Tablet"],
  ["Paracetamol 650mg", "Tablet"],
  ["Amoxicillin 500mg", "Capsule"],
  ["Azithromycin 500mg", "Tablet"],
  ["Cetirizine 10mg", "Tablet"],
  ["Pantoprazole 40mg", "Tablet"],
  ["Ibuprofen 400mg", "Tablet"],
  ["Diclofenac Gel", "Ointment"],
  ["Metformin 500mg", "Tablet"],
  ["Amlodipine 5mg", "Tablet"],
  ["ORS Powder", "Other"],
  ["Cough Syrup (Dextromethorphan)", "Syrup"],
  ["Paracetamol Syrup 250mg/5ml", "Syrup"],
  ["Vitamin D3 60000 IU", "Capsule"],
  ["Calcium + Vitamin D3", "Tablet"],
  ["Chlorhexidine Mouthwash", "Other"],
  ["Ciprofloxacin Eye Drops", "Drops"],
];

async function upsertUser({ name, email, password, role }) {
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { name, email, role, passwordHash: await bcrypt.hash(password, 10) },
  });
}

async function main() {
  // Admin
  await upsertUser({ name: "Clinic Admin", email: "admin@clinic.com", password: "Admin@123", role: "ADMIN" });

  // Departments
  const depts = {};
  for (const d of DEPARTMENTS) {
    depts[d.name] = await prisma.department.upsert({ where: { name: d.name }, update: {}, create: d });
  }

  // Doctors + weekly schedules
  for (const d of DOCTORS) {
    const user = await upsertUser({ name: d.name, email: d.email, password: "Doctor@123", role: "DOCTOR" });
    const doctor = await prisma.doctor.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        departmentId: depts[d.dept].id,
        qualification: d.qualification,
        phone: d.phone,
        fee: d.fee,
      },
    });
    for (const weekday of d.schedule.days) {
      await prisma.doctorSchedule.upsert({
        where: { doctorId_weekday: { doctorId: doctor.id, weekday } },
        update: {},
        create: {
          doctorId: doctor.id,
          weekday,
          startTime: d.schedule.start,
          endTime: d.schedule.end,
          slotMinutes: d.schedule.slot,
        },
      });
    }
  }

  // Medicines
  for (const [name, type] of MEDICINES) {
    await prisma.medicine.upsert({ where: { name }, update: {}, create: { name, type } });
  }

  // Demo patient
  const patientUser = await upsertUser({
    name: "Rahul Verma",
    email: "patient@clinic.com",
    password: "Patient@123",
    role: "PATIENT",
  });
  await prisma.patient.upsert({
    where: { userId: patientUser.id },
    update: {},
    create: {
      userId: patientUser.id,
      gender: "Male",
      dob: new Date("1998-04-12T00:00:00.000Z"),
      phone: "9876543210",
      address: "Clement Town, Dehradun",
    },
  });

  console.log("Seed complete. Demo logins:");
  console.table([
    { role: "Admin", email: "admin@clinic.com", password: "Admin@123" },
    { role: "Doctor", email: "anil.sharma@clinic.com", password: "Doctor@123" },
    { role: "Patient", email: "patient@clinic.com", password: "Patient@123" },
  ]);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
