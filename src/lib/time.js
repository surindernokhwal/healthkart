// All clinic dates and times are in Indian Standard Time, whatever the
// server's own timezone is (Vercel runs in UTC).
export const TZ = "Asia/Kolkata";

const dateFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// "YYYY-MM-DD" of a timestamp, in IST.
export function istDateStr(date = new Date()) {
  return dateFmt.format(date);
}

export function todayIST() {
  return istDateStr(new Date());
}

// "YYYY-MM-DD" -> Date at UTC midnight (how Prisma stores @db.Date values).
export function dateOnly(dateStr) {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

// Date from a @db.Date column -> "YYYY-MM-DD".
export function toDateStr(date) {
  return new Date(date).toISOString().slice(0, 10);
}

export function addDays(dateStr, days) {
  const d = dateOnly(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return toDateStr(d);
}

export function isValidDateStr(s) {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(dateOnly(s)) && toDateStr(dateOnly(s)) === s;
}

// 0 = Sunday ... 6 = Saturday
export function weekdayOf(dateStr) {
  return dateOnly(dateStr).getUTCDay();
}

export function timeToMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(mins) {
  const h = String(Math.floor(mins / 60)).padStart(2, "0");
  const m = String(mins % 60).padStart(2, "0");
  return `${h}:${m}`;
}

// The real instant of an appointment slot (date + "HH:MM" in IST).
export function slotInstant(dateStr, hhmm) {
  return new Date(`${dateStr}T${hhmm}:00+05:30`);
}

export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
