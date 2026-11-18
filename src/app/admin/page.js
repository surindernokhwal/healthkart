import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { addDays, dateOnly, istDateStr, slotInstant, toDateStr, todayIST } from "@/lib/time";
import { formatDate, formatINR, formatTime } from "@/lib/format";
import { Badge, Empty, PageHeader, StatCard, TableWrap } from "@/components/ui";
import BarChartCard from "@/components/BarChartCard";

export const metadata = { title: "Admin Dashboard" };

export default async function AdminDashboard() {
  await requireRole("ADMIN");
  const today = todayIST();
  const weekStart = addDays(today, -6);

  const [todayAppts, patientCount, doctorCount, todayRevenue, pending, weekAppts, weekBills] = await Promise.all([
    prisma.appointment.findMany({
      where: { date: dateOnly(today), status: { not: "CANCELLED" } },
      include: { patient: { include: { user: true } }, doctor: { include: { user: true, department: true } } },
      orderBy: { timeSlot: "asc" },
    }),
    prisma.patient.count(),
    prisma.doctor.count({ where: { user: { isActive: true } } }),
    prisma.bill.aggregate({
      _sum: { amount: true },
      where: { status: "PAID", paidAt: { gte: slotInstant(today, "00:00") } },
    }),
    prisma.bill.aggregate({ _sum: { amount: true }, _count: true, where: { status: "PENDING" } }),
    prisma.appointment.findMany({
      where: { date: { gte: dateOnly(weekStart), lte: dateOnly(today) }, status: { not: "CANCELLED" } },
      select: { date: true },
    }),
    prisma.bill.findMany({
      where: { status: "PAID", paidAt: { gte: slotInstant(weekStart, "00:00") } },
      select: { paidAt: true, amount: true },
    }),
  ]);

  // Last 7 days, grouped with a Map keyed by date
  const days = new Map();
  for (let i = 0; i < 7; i++) {
    const d = addDays(weekStart, i);
    days.set(d, { day: formatDate(d).slice(0, 6), appointments: 0, revenue: 0 });
  }
  for (const a of weekAppts) {
    const g = days.get(toDateStr(a.date));
    if (g) g.appointments++;
  }
  for (const b of weekBills) {
    const g = days.get(istDateStr(b.paidAt));
    if (g) g.revenue = Math.round((g.revenue + Number(b.amount)) * 100) / 100;
  }
  const chart = [...days.values()];

  return (
    <>
      <PageHeader title="Dashboard" subtitle={`Today is ${formatDate(today)}`}>
        <Link href="/admin/reports" className="btn-secondary">
          Reports
        </Link>
        <Link href="/admin/doctors/new" className="btn-primary">
          Add doctor
        </Link>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Today's appointments" value={todayAppts.length} />
        <StatCard label="Total patients" value={patientCount} />
        <StatCard label="Active doctors" value={doctorCount} />
        <StatCard
          label="Today's revenue"
          value={formatINR(todayRevenue._sum.amount)}
          hint={`${pending._count} bills pending (${formatINR(pending._sum.amount)})`}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 font-semibold">Appointments: last 7 days</h2>
          <BarChartCard data={chart} xKey="day" series={["appointments"]} height={240} />
        </div>
        <div className="card">
          <h2 className="mb-3 font-semibold">Revenue collected: last 7 days</h2>
          <BarChartCard data={chart} xKey="day" series={["revenue"]} height={240} money />
        </div>
      </div>

      <div className="card mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Today&apos;s appointments</h2>
          <Link href={`/admin/appointments?from=${today}&to=${today}`} className="link text-sm">
            View all
          </Link>
        </div>
        {todayAppts.length === 0 ? (
          <Empty>No appointments today.</Empty>
        ) : (
          <TableWrap>
            <table className="table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Department</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {todayAppts.map((a) => (
                  <tr key={a.id}>
                    <td className="whitespace-nowrap">{formatTime(a.timeSlot)}</td>
                    <td>{a.patient.user.name}</td>
                    <td>Dr. {a.doctor.user.name}</td>
                    <td>{a.doctor.department.name}</td>
                    <td>
                      <Badge status={a.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </div>
    </>
  );
}
