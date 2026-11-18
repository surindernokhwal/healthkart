import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { addDays, dateOnly, todayIST } from "@/lib/time";
import { formatDate } from "@/lib/format";
import { Alert, PageHeader, StatCard } from "@/components/ui";
import AppointmentList from "@/components/AppointmentList";

export const metadata = { title: "Today" };

export default async function DoctorHome() {
  const user = await requireRole("DOCTOR");
  const doctorId = user.doctor.id;
  const today = todayIST();
  const include = { patient: { include: { user: true } } };

  const [todays, upcoming, scheduleCount] = await Promise.all([
    prisma.appointment.findMany({
      where: { doctorId, date: dateOnly(today), status: { not: "CANCELLED" } },
      include,
      orderBy: { timeSlot: "asc" },
    }),
    prisma.appointment.findMany({
      where: {
        doctorId,
        status: "CONFIRMED",
        date: { gt: dateOnly(today), lte: dateOnly(addDays(today, 7)) },
      },
      include,
      orderBy: [{ date: "asc" }, { timeSlot: "asc" }],
    }),
    prisma.doctorSchedule.count({ where: { doctorId } }),
  ]);

  const done = todays.filter((a) => a.status === "COMPLETED").length;

  return (
    <>
      <PageHeader title={`Good day, Dr. ${user.name}`} subtitle={formatDate(today)} />
      {scheduleCount === 0 && (
        <Alert type="info">
          You have not set your weekly availability yet, so patients cannot book you.{" "}
          <Link href="/doctor/schedule" className="link">
            Set your schedule
          </Link>
        </Alert>
      )}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Today's appointments" value={todays.length} />
        <StatCard label="Completed" value={done} />
        <StatCard label="Remaining" value={todays.length - done} />
      </div>
      <div className="card mb-6">
        <h2 className="mb-3 font-semibold">Today&apos;s appointments</h2>
        <AppointmentList appointments={todays} emptyText="No appointments today." />
      </div>
      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Upcoming (next 7 days)</h2>
          <Link href="/doctor/appointments" className="link text-sm">
            All appointments
          </Link>
        </div>
        <AppointmentList appointments={upcoming} showDate emptyText="No upcoming appointments." />
      </div>
    </>
  );
}
