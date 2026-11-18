import { prisma } from "./prisma";
import { addDays, dateOnly, istDateStr, slotInstant, toDateStr, todayIST } from "./time";
import { ageFrom, billNumber } from "./format";

// Admin reports (Table 10). Every report returns plain, serialisable data:
// { title, columns: [{ key, label }], rows: [...], chart: { data, xKey, series } | null, summary }

export const REPORT_TYPES = {
  appointments: "Daily Appointment Report",
  "doctor-wise": "Doctor-wise Appointment Report",
  "department-wise": "Department-wise Patient Count",
  "revenue-daily": "Daily Revenue Report",
  "revenue-monthly": "Monthly Revenue Report",
  pending: "Pending Payments Report",
  cancelled: "Cancelled Appointments Report",
  "new-patients": "New Patient Registration Report",
};

// Date-only range (for @db.Date columns)
const dateRange = (from, to) => ({ gte: dateOnly(from), lte: dateOnly(to) });
// Timestamp range covering whole IST days
const timeRange = (from, to) => ({ gte: slotInstant(from, "00:00"), lt: slotInstant(addDays(to, 1), "00:00") });

const apptInclude = {
  patient: { include: { user: true } },
  doctor: { include: { user: true, department: true } },
  bill: true,
};

// Group records into a Map and return its values (step 2 of M7 logic).
function groupBy(items, keyFn, init, add) {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, init(item, key));
    add(map.get(key), item);
  }
  return [...map.values()];
}

const money = (n) => Math.round(Number(n) * 100) / 100;

export function defaultRange() {
  const to = todayIST();
  return { from: addDays(to, -29), to };
}

export async function buildReport(type, from, to) {
  const title = REPORT_TYPES[type];
  if (!title) throw new Error("Unknown report");

  switch (type) {
    case "appointments": {
      const appts = await prisma.appointment.findMany({
        where: { date: dateRange(from, to) },
        include: apptInclude,
        orderBy: [{ date: "asc" }, { timeSlot: "asc" }],
      });
      const rows = appts.map((a) => ({
        date: toDateStr(a.date),
        time: a.timeSlot,
        bookingCode: a.bookingCode,
        patient: a.patient.user.name,
        doctor: a.doctor.user.name,
        department: a.doctor.department.name,
        status: a.status,
      }));
      const chart = groupBy(
        rows,
        (r) => r.date,
        (r) => ({ date: r.date, Confirmed: 0, Completed: 0, Cancelled: 0 }),
        (g, r) => g[r.status[0] + r.status.slice(1).toLowerCase()]++
      );
      return {
        title,
        columns: [
          { key: "date", label: "Date" },
          { key: "time", label: "Time" },
          { key: "bookingCode", label: "Booking ID" },
          { key: "patient", label: "Patient" },
          { key: "doctor", label: "Doctor" },
          { key: "department", label: "Department" },
          { key: "status", label: "Status" },
        ],
        rows,
        chart: { data: chart, xKey: "date", series: ["Confirmed", "Completed", "Cancelled"], stacked: true },
        summary: `${rows.length} appointments`,
      };
    }

    case "doctor-wise": {
      const appts = await prisma.appointment.findMany({ where: { date: dateRange(from, to) }, include: apptInclude });
      const rows = groupBy(
        appts,
        (a) => a.doctorId,
        (a) => ({
          doctor: a.doctor.user.name,
          department: a.doctor.department.name,
          total: 0,
          confirmed: 0,
          completed: 0,
          cancelled: 0,
          revenue: 0,
        }),
        (g, a) => {
          g.total++;
          g[a.status.toLowerCase()]++;
          if (a.bill?.status === "PAID") g.revenue = money(g.revenue + Number(a.bill.amount));
        }
      ).sort((x, y) => y.total - x.total);
      return {
        title,
        columns: [
          { key: "doctor", label: "Doctor" },
          { key: "department", label: "Department" },
          { key: "total", label: "Total" },
          { key: "confirmed", label: "Upcoming" },
          { key: "completed", label: "Completed" },
          { key: "cancelled", label: "Cancelled" },
          { key: "revenue", label: "Revenue (₹)" },
        ],
        rows,
        chart: { data: rows, xKey: "doctor", series: ["completed", "confirmed", "cancelled"], stacked: true },
        summary: `${rows.length} doctors, ${appts.length} appointments`,
      };
    }

    case "department-wise": {
      const appts = await prisma.appointment.findMany({
        where: { date: dateRange(from, to), status: { not: "CANCELLED" } },
        include: apptInclude,
      });
      const rows = groupBy(
        appts,
        (a) => a.doctor.departmentId,
        (a) => ({ department: a.doctor.department.name, appointments: 0, patients: new Set() }),
        (g, a) => {
          g.appointments++;
          g.patients.add(a.patientId);
        }
      )
        .map((g) => ({ department: g.department, appointments: g.appointments, patients: g.patients.size }))
        .sort((x, y) => y.patients - x.patients);
      return {
        title,
        columns: [
          { key: "department", label: "Department" },
          { key: "patients", label: "Unique Patients" },
          { key: "appointments", label: "Appointments" },
        ],
        rows,
        chart: { data: rows, xKey: "department", series: ["patients", "appointments"] },
        summary: "Cancelled appointments are excluded",
      };
    }

    case "revenue-daily":
    case "revenue-monthly": {
      const bills = await prisma.bill.findMany({
        where: { status: "PAID", paidAt: timeRange(from, to) },
        orderBy: { paidAt: "asc" },
      });
      const monthly = type === "revenue-monthly";
      const rows = groupBy(
        bills,
        (b) => (monthly ? istDateStr(b.paidAt).slice(0, 7) : istDateStr(b.paidAt)),
        (b, key) => ({ period: key, bills: 0, cash: 0, upi: 0, total: 0 }),
        (g, b) => {
          const amt = Number(b.amount);
          g.bills++;
          g[b.mode === "UPI" ? "upi" : "cash"] = money(g[b.mode === "UPI" ? "upi" : "cash"] + amt);
          g.total = money(g.total + amt);
        }
      );
      const total = money(rows.reduce((s, r) => s + r.total, 0));
      return {
        title,
        columns: [
          { key: "period", label: monthly ? "Month" : "Date" },
          { key: "bills", label: "Bills Paid" },
          { key: "cash", label: "Cash (₹)" },
          { key: "upi", label: "UPI (₹)" },
          { key: "total", label: "Total (₹)" },
        ],
        rows,
        chart: { data: rows, xKey: "period", series: ["cash", "upi"], stacked: true },
        summary: `Total revenue: ₹${total.toLocaleString("en-IN")}`,
      };
    }

    case "pending": {
      const bills = await prisma.bill.findMany({
        where: { status: "PENDING", billDate: timeRange(from, to) },
        include: { appointment: { include: apptInclude } },
        orderBy: { billDate: "asc" },
      });
      const now = Date.now();
      const rows = bills.map((b) => ({
        bill: billNumber(b.id),
        billDate: istDateStr(b.billDate),
        patient: b.appointment.patient.user.name,
        phone: b.appointment.patient.phone,
        doctor: b.appointment.doctor.user.name,
        amount: money(b.amount),
        daysPending: Math.floor((now - b.billDate.getTime()) / 86400_000),
      }));
      const total = money(rows.reduce((s, r) => s + r.amount, 0));
      return {
        title,
        columns: [
          { key: "bill", label: "Bill No." },
          { key: "billDate", label: "Bill Date" },
          { key: "patient", label: "Patient" },
          { key: "phone", label: "Phone" },
          { key: "doctor", label: "Doctor" },
          { key: "amount", label: "Amount (₹)" },
          { key: "daysPending", label: "Days Pending" },
        ],
        rows,
        chart: null,
        summary: `${rows.length} pending bills, ₹${total.toLocaleString("en-IN")} outstanding`,
      };
    }

    case "cancelled": {
      const appts = await prisma.appointment.findMany({
        where: { date: dateRange(from, to), status: "CANCELLED" },
        include: apptInclude,
        orderBy: [{ date: "asc" }, { timeSlot: "asc" }],
      });
      const rows = appts.map((a) => ({
        date: toDateStr(a.date),
        time: a.timeSlot,
        bookingCode: a.bookingCode,
        patient: a.patient.user.name,
        doctor: a.doctor.user.name,
        department: a.doctor.department.name,
      }));
      const chart = groupBy(
        rows,
        (r) => r.date,
        (r) => ({ date: r.date, cancelled: 0 }),
        (g) => g.cancelled++
      );
      return {
        title,
        columns: [
          { key: "date", label: "Date" },
          { key: "time", label: "Time" },
          { key: "bookingCode", label: "Booking ID" },
          { key: "patient", label: "Patient" },
          { key: "doctor", label: "Doctor" },
          { key: "department", label: "Department" },
        ],
        rows,
        chart: { data: chart, xKey: "date", series: ["cancelled"] },
        summary: `${rows.length} cancelled appointments`,
      };
    }

    case "new-patients": {
      const patients = await prisma.patient.findMany({
        where: { user: { createdAt: timeRange(from, to) } },
        include: { user: true },
        orderBy: { user: { createdAt: "asc" } },
      });
      const rows = patients.map((p) => ({
        registered: istDateStr(p.user.createdAt),
        name: p.user.name,
        email: p.user.email,
        phone: p.phone,
        gender: p.gender,
        age: ageFrom(p.dob),
      }));
      const chart = groupBy(
        rows,
        (r) => r.registered,
        (r) => ({ date: r.registered, registrations: 0 }),
        (g) => g.registrations++
      );
      return {
        title,
        columns: [
          { key: "registered", label: "Registered On" },
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "phone", label: "Phone" },
          { key: "gender", label: "Gender" },
          { key: "age", label: "Age" },
        ],
        rows,
        chart: { data: chart, xKey: "date", series: ["registrations"] },
        summary: `${rows.length} new patients`,
      };
    }
  }
}

export function toCSV(report) {
  const cell = (v) => {
    let s = String(v ?? "");
    // Neutralise spreadsheet formula injection
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = report.columns.map((c) => cell(c.label)).join(",");
  const lines = report.rows.map((r) => report.columns.map((c) => cell(r[c.key])).join(","));
  return "﻿" + [header, ...lines].join("\r\n");
}
