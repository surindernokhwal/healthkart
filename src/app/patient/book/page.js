import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { MAX_ADVANCE_DAYS, canModify, getFreeSlots } from "@/lib/slots";
import { addDays, dateOnly, isValidDateStr, toDateStr, todayIST, weekdayOf, WEEKDAYS } from "@/lib/time";
import { formatDate, formatINR, formatTime, toId } from "@/lib/format";
import { Alert, Empty, PageHeader } from "@/components/ui";
import SlotPicker from "./SlotPicker";

export const metadata = { title: "Book Appointment" };

// Booking flow (FR-13, FR-14): department -> doctor -> date -> free slot
export default async function BookPage({ searchParams }) {
  const user = await requireRole("PATIENT");
  const sp = await searchParams;
  const today = todayIST();
  const lastDay = addDays(today, MAX_ADVANCE_DAYS);

  // The database is far away (about 0.13 s per query), so independent queries
  // run together with Promise.all instead of one after another.

  // Round 1: the appointment being rescheduled (if any) and the departments
  const rescheduleId = toId(sp.reschedule);
  const [appt, departments] = await Promise.all([
    rescheduleId ? prisma.appointment.findUnique({ where: { id: rescheduleId }, include: { doctor: true } }) : null,
    prisma.department.findMany({
      where: { isActive: true, doctors: { some: { user: { isActive: true } } } },
      orderBy: { name: "asc" },
    }),
  ]);

  // Rescheduling an existing appointment keeps the same doctor
  const reschedule = appt && appt.patientId === user.patient.id && canModify(appt) ? appt : null;

  const deptId = reschedule?.doctor.departmentId ?? toId(sp.dept);
  const dept = departments.find((d) => d.id === deptId);
  const doctorId = reschedule?.doctorId ?? toId(sp.doctor);
  const date = isValidDateStr(sp.date) && sp.date >= today && sp.date <= lastDay ? sp.date : null;

  // Round 2: the department's doctors, the chosen doctor's leave days and free
  // slots. Leave and slots are only used below if the doctor really belongs to
  // the chosen department (checked with doctors.find).
  const wantDoctor = Boolean(dept && doctorId);
  const [doctors, leaves, freeSlots] = await Promise.all([
    dept
      ? prisma.doctor.findMany({
          where: { departmentId: dept.id, user: { isActive: true } },
          include: { user: true, schedules: true },
          orderBy: { user: { name: "asc" } },
        })
      : [],
    wantDoctor
      ? prisma.doctorLeave.findMany({
          where: { doctorId, leaveDate: { gte: dateOnly(today), lte: dateOnly(lastDay) } },
        })
      : [],
    wantDoctor && date ? getFreeSlots(doctorId, date) : null,
  ]);
  const doctor = doctors.find((d) => d.id === doctorId);
  const availability = doctor && date ? freeSlots : null;

  // Date strip: next 30 days, marking days the doctor does not work or is on leave
  let days = [];
  if (doctor) {
    const leaveSet = new Set(leaves.map((l) => toDateStr(l.leaveDate)));
    const workSet = new Set(doctor.schedules.map((s) => s.weekday));
    for (let i = 0; i <= MAX_ADVANCE_DAYS; i++) {
      const d = addDays(today, i);
      days.push({ date: d, available: workSet.has(weekdayOf(d)) && !leaveSet.has(d), onLeave: leaveSet.has(d) });
    }
  }

  const link = (params) => {
    const p = new URLSearchParams();
    if (reschedule) p.set("reschedule", reschedule.id);
    for (const [k, v] of Object.entries(params)) if (v) p.set(k, v);
    return `/patient/book?${p}`;
  };

  return (
    <>
      <PageHeader
        title={reschedule ? "Reschedule appointment" : "Book an appointment"}
        subtitle="Choose a department, a doctor, a date and a free time slot"
      />

      {reschedule && (
        <Alert type="info">
          Rescheduling booking <b>{reschedule.bookingCode}</b> ({formatDate(reschedule.date)},{" "}
          {formatTime(reschedule.timeSlot)}). Pick a new date and time; the old slot is released automatically.{" "}
          <Link href="/patient/appointments" className="link">
            Cancel rescheduling
          </Link>
        </Alert>
      )}
      {sp.reschedule && !reschedule && (
        <Alert>This appointment can no longer be rescheduled (less than 2 hours left, or not found).</Alert>
      )}

      {/* Step 1: department */}
      <section className="card mb-4">
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-slate-500 uppercase">1. Department</h2>
        {departments.length === 0 ? (
          <Empty>No departments are open for booking yet.</Empty>
        ) : (
          <div className="flex flex-wrap gap-2">
            {departments.map((d) => (
              <Link
                key={d.id}
                href={reschedule ? "#" : link({ dept: d.id })}
                aria-disabled={Boolean(reschedule)}
                className={`rounded-full border px-4 py-1.5 text-sm ${
                  d.id === dept?.id
                    ? "border-teal-700 bg-teal-700 text-white"
                    : reschedule
                      ? "pointer-events-none border-slate-200 text-slate-300"
                      : "border-slate-300 text-slate-700 hover:border-teal-600"
                }`}
              >
                {d.name}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Step 2: doctor */}
      {dept && (
        <section className="card mb-4">
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-slate-500 uppercase">2. Doctor</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {doctors.map((d) => {
              const selected = d.id === doctor?.id;
              const workDays = [...d.schedules]
                .sort((a, b) => ((a.weekday + 6) % 7) - ((b.weekday + 6) % 7))
                .map((s) => WEEKDAYS[s.weekday].slice(0, 3))
                .join(", ");
              return (
                <Link
                  key={d.id}
                  href={reschedule ? "#" : link({ dept: dept.id, doctor: d.id })}
                  className={`rounded-xl border p-4 transition ${
                    selected
                      ? "border-teal-700 bg-teal-50 ring-1 ring-teal-700"
                      : reschedule
                        ? "pointer-events-none border-slate-200 opacity-50"
                        : "border-slate-200 hover:border-teal-600"
                  }`}
                >
                  <p className="font-medium">Dr. {d.user.name}</p>
                  <p className="text-sm text-slate-500">{d.qualification}</p>
                  <p className="mt-2 text-sm">
                    Fee: <span className="font-medium">{formatINR(d.fee)}</span>
                  </p>
                  <p className="text-xs text-slate-500">{workDays || "Schedule not set yet"}</p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Step 3: date */}
      {doctor && (
        <section className="card mb-4">
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-slate-500 uppercase">3. Date</h2>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
            {days.map((d) => {
              const selected = d.date === date;
              const [, , dd] = d.date.split("-");
              const label = (
                <>
                  <span className="text-xs">{WEEKDAYS[weekdayOf(d.date)].slice(0, 3)}</span>
                  <span className="text-lg font-semibold">{Number(dd)}</span>
                  <span className="text-[10px]">{formatDate(d.date).split(" ")[1]}</span>
                </>
              );
              const cls = "flex w-14 shrink-0 flex-col items-center rounded-lg border py-2";
              return d.available ? (
                <Link
                  key={d.date}
                  href={link({ dept: dept.id, doctor: doctor.id, date: d.date })}
                  className={`${cls} ${
                    selected ? "border-teal-700 bg-teal-700 text-white" : "border-slate-300 hover:border-teal-600"
                  }`}
                >
                  {label}
                </Link>
              ) : (
                <span
                  key={d.date}
                  title={d.onLeave ? "Doctor on leave" : "Doctor not working"}
                  className={`${cls} border-slate-100 bg-slate-50 text-slate-300`}
                >
                  {label}
                </span>
              );
            })}
          </div>
        </section>
      )}

      {/* Step 4: slot */}
      {doctor && date && (
        <section className="card">
          <h2 className="mb-3 text-sm font-semibold tracking-wide text-slate-500 uppercase">
            4. Time slot on {formatDate(date)}
          </h2>
          {availability.slots.length === 0 ? (
            <Empty>{availability.message}</Empty>
          ) : (
            <SlotPicker
              key={`${doctor.id}-${date}`}
              slots={availability.slots}
              doctorId={doctor.id}
              doctorName={doctor.user.name}
              date={date}
              rescheduleId={reschedule?.id}
              fee={formatINR(doctor.fee)}
            />
          )}
        </section>
      )}
    </>
  );
}
