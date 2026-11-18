import { TZ, toDateStr } from "./time";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export function formatINR(value) {
  return inr.format(Number(value ?? 0));
}

// Display a @db.Date value, e.g. "15 Nov 2026"
export function formatDate(date) {
  if (!date) return "";
  const [y, m, d] = toDateStr(date).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

// Display a timestamp in IST, e.g. "15 Nov 2026, 3:20 pm"
export function formatDateTime(date) {
  if (!date) return "";
  return new Date(date).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: TZ,
  });
}

// "14:30" -> "2:30 PM"
export function formatTime(hhmm) {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function ageFrom(dob) {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const m = now.getUTCMonth() - birth.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < birth.getUTCDate())) age--;
  return age;
}

// Parse a database id from a URL/form value; 0 when invalid (never matches)
export function toId(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 && n <= 2147483647 ? n : 0;
}

export function billNumber(id) {
  return `INV-${String(id).padStart(5, "0")}`;
}
