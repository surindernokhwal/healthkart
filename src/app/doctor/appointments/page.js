import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { addDays, dateOnly, isValidDateStr, todayIST } from "@/lib/time";
import { PageHeader } from "@/components/ui";
import AppointmentList from "@/components/AppointmentList";

export const metadata = { title: "Appointments" };

const STATUSES = ["CONFIRMED", "COMPLETED", "CANCELLED"];

export default async function DoctorAppointments({ searchParams }) {
  const user = await requireRole("DOCTOR");
  const sp = await searchParams;
  const today = todayIST();
  const from = isValidDateStr(sp.from) ? sp.from : today;
  const to = isValidDateStr(sp.to) ? sp.to : addDays(today, 30);
  const status = STATUSES.includes(sp.status) ? sp.status : "";

  const appointments = await prisma.appointment.findMany({
    where: {
      doctorId: user.doctor.id,
      date: { gte: dateOnly(from), lte: dateOnly(to) },
      ...(status && { status }),
    },
    include: { patient: { include: { user: true } } },
    orderBy: [{ date: "asc" }, { timeSlot: "asc" }],
    take: 300,
  });

  return (
    <>
      <PageHeader title="Appointments" subtitle="Your appointments for any date range" />
      <form className="card mb-6 flex flex-wrap gap-2">
        <input type="date" name="from" defaultValue={from} className="input w-auto" aria-label="From" />
        <input type="date" name="to" defaultValue={to} className="input w-auto" aria-label="To" />
        <select name="status" defaultValue={status} className="input w-auto" aria-label="Status">
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
        <button className="btn-primary">Show</button>
      </form>
      <div className="card">
        <AppointmentList appointments={appointments} showDate emptyText="No appointments in this range." />
      </div>
    </>
  );
}
