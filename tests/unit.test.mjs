// Unit tests for the business logic that does not need the database.
// Run with:  npm test
import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { addDays, isValidDateStr, slotInstant, timeToMinutes, minutesToTime, weekdayOf } from "../src/lib/time.js";
import { generateSlots, slotKey, bookingCode, canModify } from "../src/lib/slots.js";
import { billNumber, formatINR, formatTime, toId } from "../src/lib/format.js";
import { safeNextPath } from "../src/lib/redirect.js";
import { toCSV } from "../src/lib/reports.js";
import {
  bookingSchema,
  loginSchema,
  readScheduleForm,
  registerSchema,
  scheduleDaySchema,
  zodCheck,
} from "../src/lib/validation.js";

const form = (obj) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(obj)) f.append(k, v);
  return f;
};

describe("Date and time helpers (Indian Standard Time)", () => {
  test("addDays crosses month and year ends", () => {
    assert.equal(addDays("2026-12-31", 1), "2027-01-01");
    assert.equal(addDays("2026-03-01", -1), "2026-02-28");
  });
  test("isValidDateStr rejects impossible dates", () => {
    assert.equal(isValidDateStr("2026-02-30"), false);
    assert.equal(isValidDateStr("2028-02-29"), true);
    assert.equal(isValidDateStr("29-02-2028"), false);
  });
  test("weekdayOf returns 0 for Sunday", () => {
    assert.equal(weekdayOf("2026-11-15"), 0);
    assert.equal(weekdayOf("2026-11-18"), 3);
  });
  test("slotInstant treats a slot as IST (UTC+05:30)", () => {
    assert.equal(slotInstant("2026-11-19", "10:00").toISOString(), "2026-11-19T04:30:00.000Z");
  });
  test("minutes conversion round-trips", () => {
    assert.equal(timeToMinutes("09:30"), 570);
    assert.equal(minutesToTime(570), "09:30");
  });
});

describe("Slot generation (M4 algorithm)", () => {
  test("10:00-13:00 every 15 minutes gives 12 slots", () => {
    const s = generateSlots("10:00", "13:00", 15);
    assert.equal(s.length, 12);
    assert.equal(s[0], "10:00");
    assert.equal(s.at(-1), "12:45");
  });
  test("a slot that does not fit before the end time is not created", () => {
    assert.deepEqual(generateSlots("16:00", "17:00", 45), ["16:00"]);
  });
  test("slot key identifies doctor, date and time", () => {
    assert.equal(slotKey(3, "2026-11-19", "10:30"), "3|2026-11-19|10:30");
  });
  test("booking code is CL + 8 characters and random", () => {
    const codes = new Set(Array.from({ length: 200 }, bookingCode));
    assert.equal(codes.size, 200);
    for (const c of codes) assert.match(c, /^CL[A-Z0-9]{8}$/);
  });
  test("2-hour rule: cancel allowed 3 hours ahead, not 1 hour ahead or after completion", () => {
    const at = (h) => {
      const d = new Date(Date.now() + h * 3600_000);
      const ist = new Date(d.getTime() + 5.5 * 3600_000).toISOString();
      return { date: ist.slice(0, 10), timeSlot: ist.slice(11, 16) };
    };
    assert.equal(canModify({ status: "CONFIRMED", ...at(3) }), true);
    assert.equal(canModify({ status: "CONFIRMED", ...at(1) }), false);
    assert.equal(canModify({ status: "COMPLETED", ...at(48) }), false);
  });
});

describe("Validation (Zod schemas shared by browser and server)", () => {
  test("login requires a valid email and a password", () => {
    const errors = zodCheck(loginSchema)(form({ email: "abc", password: "" }));
    assert.ok(errors.email && errors.password);
  });
  test("registration enforces password strength and matching passwords", () => {
    const base = { name: "Asha Rana", email: "asha@example.com", phone: "9876543210", gender: "Female", dob: "1999-05-01" };
    assert.ok(zodCheck(registerSchema)(form({ ...base, password: "weakpass", confirmPassword: "weakpass" })).password);
    assert.ok(zodCheck(registerSchema)(form({ ...base, password: "Strong123", confirmPassword: "Strong124" })).confirmPassword);
    assert.equal(zodCheck(registerSchema)(form({ ...base, password: "Strong123", confirmPassword: "Strong123" })), null);
  });
  test("mobile number must be 10 digits starting with 6-9", () => {
    const r = registerSchema.safeParse({ name: "Asha", email: "a@b.co", phone: "5123456789", gender: "Female", dob: "1999-05-01", password: "Strong123", confirmPassword: "Strong123" });
    assert.equal(r.success, false);
  });
  test("schedule: end after start and slot of 10-60 minutes that fits", () => {
    assert.equal(scheduleDaySchema.safeParse({ weekday: 1, startTime: "13:00", endTime: "10:00", slotMinutes: 15 }).success, false);
    assert.equal(scheduleDaySchema.safeParse({ weekday: 1, startTime: "10:00", endTime: "10:20", slotMinutes: 30 }).success, false);
    assert.equal(scheduleDaySchema.safeParse({ weekday: 1, startTime: "10:00", endTime: "13:00", slotMinutes: 5 }).success, false);
    const { days, errors } = readScheduleForm(form({ works_1: "on", start_1: "10:00", end_1: "13:00", slot_1: "15" }));
    assert.equal(days.length, 1);
    assert.deepEqual(errors, {});
  });
  test("booking rejects a malformed time slot", () => {
    assert.equal(bookingSchema.safeParse({ doctorId: "1", date: "2026-11-19", timeSlot: "25:00" }).success, false);
  });
});

describe("Formatting and security helpers", () => {
  test("toId accepts only positive 32-bit integers (0 = invalid, matches no record)", () => {
    assert.equal(toId("15"), 15);
    assert.equal(toId("0"), 0);
    assert.equal(toId("-5"), 0);
    assert.equal(toId("1.5"), 0);
    assert.equal(toId("abc"), 0);
    assert.equal(toId("99999999999"), 0);
  });
  test("bill number and currency formatting", () => {
    assert.equal(billNumber(7), "INV-00007");
    assert.match(formatINR(500), /₹\s?500/);
    assert.equal(formatTime("16:20"), "4:20 PM");
  });
  test("login redirect accepts only paths on this website (no open redirect)", () => {
    assert.equal(safeNextPath("/patient/book?dept=1"), "/patient/book?dept=1");
    assert.equal(safeNextPath("http://localhost:3000/patient/book"), "/patient/book");
    assert.equal(safeNextPath("//evil.com"), null);
    assert.equal(safeNextPath("/\\evil.com"), null);
    assert.equal(safeNextPath("javascript:alert(1)"), null);
  });
  test("CSV export escapes quotes and blocks spreadsheet formulas", () => {
    const csv = toCSV({
      columns: [{ key: "name", label: "Name" }, { key: "note", label: "Note" }],
      rows: [{ name: '=HYPERLINK("x")', note: 'said "hi", left' }],
    });
    const lines = csv.replace(/^﻿/, "").split("\r\n");
    assert.equal(lines[0], "Name,Note");
    assert.equal(lines[1], `"'=HYPERLINK(""x"")","said ""hi"", left"`);
  });
});
