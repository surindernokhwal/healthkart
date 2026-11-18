import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { addDays, dateOnly, isValidDateStr, todayIST } from "@/lib/time";
import { formatDate, formatTime, toId } from "@/lib/format";
import { Badge, Empty, PageHeader, TableWrap } from "@/components/ui";
import ConfirmButton from "@/components/ConfirmButton";
import { adminCancelAppointment } from "@/actions/admin";

export const metadata = { title: "Appointments" };

const STATUSES = ["CONFIRMED", "COMPLETED", "CANCELLED"];
const LIMIT = 300;

export default async function AdminAppointments({ searchParams }) {
  await requireRole("ADMIN");
  const sp = await searchParams;
  const today = todayIST();
  const from = isValidDateStr(sp.from) ? sp.from : addDays(today, -7);
  const to = isValidDateStr(sp.to) ? sp.to : addDays(today, 30);
  const status = STATUSES.includes(sp.status) ? sp.status : "";
  const doctorId = toId(sp.doctor) || "";
  const q = (sp.q ?? "").trim().slice(0, 100);

  const where = {
    date: { gte: dateOnly(from), lte: dateOnly(to) },
    ...(status && { status }),
    ...(doctorId && { doctorId }),
    ...(q && {
      OR: [
        { bookingCode: { contains: q, mode: "insensitive" } },
        { patient: { user: { name: { contains: q, mode: "insensitive" } } } },
        { patient: { phone: { contains: q } } },
      ],
    }),
  };

  const [appointments, doctors] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true, department: true } },
        bill: true,
      },
      orderBy: [{ date: "asc" }, { timeSlot: "asc" }],
      take: LIMIT,
    }),
    prisma.doctor.findMany({ include: { user: true }, orderBy: { user: { name: "asc" } } }),
  ]);

  return (
    <>
      <PageHeader title="Appointments" subtitle="Search and filter all appointments" />

      <form className="card mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <input name="q" defaultValue={q} placeholder="Patient name, phone or booking ID" className="input lg:col-span-2" />
        <input type="date" name="from" defaultValue={from} className="input" aria-label="From" />
        <input type="date" name="to" defaultValue={to} className="input" aria-label="To" />
        <select name="status" defaultValue={status} className="input" aria-label="Status">
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
        <select name="doctor" defaultValue={doctorId} className="input" aria-label="Doctor">
          <option value="">All doctors</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              Dr. {d.user.name}
            </option>
          ))}
        </select>
        <div className="flex gap-2 lg:col-span-6">
          <button className="btn-primary">Apply filters</button>
          <Link href="/admin/appointments" className="btn-secondary">
            Reset
          </Link>
        </div>
      </form>

      <div className="card">
        <p className="mb-3 text-sm text-slate-500">
          {appointments.length === LIMIT ? `Showing first ${LIMIT}` : `${appointments.length} appointments`} from{" "}
          {formatDate(from)} to {formatDate(to)}
        </p>
        {appointments.length === 0 ? (
          <Empty>No appointments match these filters.</Empty>
        ) : (
          <TableWrap>
            <table className="table">
              <thead>
                <tr>
                  <th>Date & time</th>
                  <th>Booking ID</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Status</th>
                  <th>Bill</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a) => (
                  <tr key={a.id}>
                    <td className="whitespace-nowrap">
                      {formatDate(a.date)}
                      <span className="block text-xs text-slate-500">{formatTime(a.timeSlot)}</span>
                    </td>
                    <td className="font-mono text-xs">{a.bookingCode}</td>
                    <td>
                      <Link href={`/admin/patients/${a.patientId}`} className="link">
                        {a.patient.user.name}
                      </Link>
                      <span className="block text-xs text-slate-500">{a.patient.phone}</span>
                    </td>
                    <td>
                      Dr. {a.doctor.user.name}
                      <span className="block text-xs text-slate-500">{a.doctor.department.name}</span>
                    </td>
                    <td>
                      <Badge status={a.status} />
                    </td>
                    <td>{a.bill ? <Badge status={a.bill.status} /> : <span className="text-slate-400">-</span>}</td>
                    <td className="text-right">
                      {a.status === "CONFIRMED" && (
                        <form action={adminCancelAppointment}>
                          <input type="hidden" name="id" value={a.id} />
                          <ConfirmButton
                            message={`Cancel appointment ${a.bookingCode} for ${a.patient.user.name}? The patient will be emailed.`}
                          >
                            Cancel
                          </ConfirmButton>
                        </form>
                      )}
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
