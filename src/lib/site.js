// Data and helpers for the public website (home, departments, doctors, about,
// contact). Only active departments and active doctors are ever shown.
import { cache } from "react";
import { prisma } from "./prisma";
import { WEEKDAYS, addDays, dateOnly, todayIST } from "./time";
import { formatTime } from "./format";

// Extra detail for the seeded departments. A department the admin adds later
// still works: it simply shows its description without this list.
export const DEPARTMENT_INFO = {
  "General Medicine": {
    tagline: "First stop for everyday illness and long-term conditions",
    services: [
      "Fever, cold, cough and viral infections",
      "Blood pressure and diabetes management",
      "Thyroid and cholesterol follow-ups",
      "Stomach, acidity and digestion problems",
      "Routine health check-ups",
      "Referral to specialists when needed",
    ],
  },
  Paediatrics: {
    tagline: "Care for newborns, children and teenagers",
    services: [
      "Newborn and well-baby check-ups",
      "Vaccination as per the national schedule",
      "Growth and nutrition monitoring",
      "Fever, cold and infections in children",
      "Allergies and asthma in children",
      "Advice for parents on diet and development",
    ],
  },
  Dental: {
    tagline: "Healthy teeth and gums for the whole family",
    services: [
      "Tooth pain and dental check-ups",
      "Cleaning and scaling",
      "Fillings and root canal treatment",
      "Tooth extraction",
      "Gum problems and bleeding gums",
      "Children's dental care",
    ],
  },
  Orthopaedics: {
    tagline: "Bones, joints, muscles and the spine",
    services: [
      "Back and neck pain",
      "Knee and joint pain, arthritis",
      "Fractures and sprains",
      "Sports injuries",
      "Osteoporosis (weak bones) care",
      "Exercise and posture advice",
    ],
  },
};

const SHORT_DAY = WEEKDAYS.map((d) => d.slice(0, 3));

// Groups a doctor's weekly schedule into readable lines, e.g.
// [{ days: "Mon – Sat", time: "10:00 AM – 1:00 PM" }]
export function scheduleSummary(schedules) {
  const byTime = new Map();
  for (const s of [...schedules].sort((a, b) => a.weekday - b.weekday)) {
    const time = `${formatTime(s.startTime)} – ${formatTime(s.endTime)}`;
    if (!byTime.has(time)) byTime.set(time, []);
    byTime.get(time).push(s.weekday);
  }
  return [...byTime].map(([time, days]) => ({ days: dayRange(days), time }));
}

// [1,2,3,4,5,6] -> "Mon – Sat";  [1,3,5] -> "Mon, Wed, Fri"
function dayRange(days) {
  const consecutive = days.length > 2 && days.every((d, i) => i === 0 || d === days[i - 1] + 1);
  if (consecutive) return `${SHORT_DAY[days[0]]} – ${SHORT_DAY[days.at(-1)]}`;
  return days.map((d) => SHORT_DAY[d]).join(", ");
}

export function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export function bookingLink(doctor) {
  return `/patient/book?dept=${doctor.departmentId}&doctor=${doctor.id}`;
}

const activeDoctor = { user: { isActive: true } };
const doctorInclude = {
  user: { select: { name: true } },
  department: { select: { id: true, name: true } },
  schedules: true,
};

// Sorted by department, then name. cache() shares one query per request.
export const getPublicDoctors = cache(() =>
  prisma.doctor.findMany({
    where: { ...activeDoctor, department: { isActive: true } },
    include: doctorInclude,
    orderBy: [{ department: { name: "asc" } }, { user: { name: "asc" } }],
  })
);

export const getPublicDepartments = cache(() =>
  prisma.department.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: {
      doctors: { where: activeDoctor, include: doctorInclude, orderBy: { user: { name: "asc" } } },
    },
  })
);

export async function getPublicDepartment(id) {
  const departments = await getPublicDepartments();
  return departments.find((d) => d.id === id) ?? null;
}

export const getPublicDoctor = cache(async (id) => {
  if (!id) return null;
  const doctor = await prisma.doctor.findFirst({
    where: { id, ...activeDoctor, department: { isActive: true } },
    include: doctorInclude,
  });
  if (!doctor) return null;

  // Upcoming leave in the next 30 days, so patients know when not to expect them
  const today = todayIST();
  const leaves = await prisma.doctorLeave.findMany({
    where: { doctorId: id, leaveDate: { gte: dateOnly(today), lte: dateOnly(addDays(today, 30)) } },
    orderBy: { leaveDate: "asc" },
  });
  return { ...doctor, leaves };
});
