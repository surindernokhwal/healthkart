import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { dateOnly, todayIST } from "@/lib/time";
import { formatDate, formatINR, formatTime } from "@/lib/format";
import { Empty, PageHeader, StatCard } from "@/components/ui";

export const metadata = { title: "Home" };

export default async function PatientHome() {
  const user = await requireRole("PATIENT");
  const patientId = user.patient.id;

  const [upcoming, visits, pending] = await Promise.all([
    prisma.appointment.findMany({
      where: { patientId, status: "CONFIRMED", date: { gte: dateOnly(todayIST()) } },
      include: { doctor: { include: { user: true, department: true } } },
      orderBy: [{ date: "asc" }, { timeSlot: "asc" }],
      take: 5,
    }),
    prisma.appointment.count({ where: { patientId, status: "COMPLETED" } }),
    prisma.bill.aggregate({
      where: { status: "PENDING", appointment: { patientId } },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  return (
    <>
      <PageHeader title={`Hello, ${user.name}`} subtitle="Manage your appointments, prescriptions and bills">
        <Link href="/patient/book" className="btn-primary">
          Book appointment
        </Link>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Upcoming appointments" value={upcoming.length} />
        <StatCard label="Completed visits" value={visits} />
        <StatCard label={`Pending bills (${pending._count})`} value={formatINR(pending._sum.amount)} hint="Pay at the clinic counter" />
      </div>

      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Upcoming appointments</h2>
          <Link href="/patient/appointments" className="link text-sm">
            View all
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <Empty>
            No upcoming appointments.{" "}
            <Link href="/patient/book" className="link">
              Book one now
            </Link>
          </Empty>
        ) : (
          <ul className="divide-y divide-slate-100">
            {upcoming.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-medium">
                    {formatDate(a.date)}, {formatTime(a.timeSlot)}
                  </p>
                  <p className="text-sm text-slate-500">
                    Dr. {a.doctor.user.name} · {a.doctor.department.name}
                  </p>
                </div>
                <span className="font-mono text-xs text-slate-500">{a.bookingCode}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
