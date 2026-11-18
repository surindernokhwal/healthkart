import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { canModify } from "@/lib/slots";
import { formatDate, formatTime } from "@/lib/format";
import { Alert, Badge, Empty, PageHeader } from "@/components/ui";
import CancelForm from "./CancelForm";

export const metadata = { title: "My Appointments" };

export default async function MyAppointments({ searchParams }) {
  const user = await requireRole("PATIENT");
  const { booked } = await searchParams;

  const appointments = await prisma.appointment.findMany({
    where: { patientId: user.patient.id },
    include: { doctor: { include: { user: true, department: true } }, prescription: true, bill: true },
    orderBy: [{ date: "desc" }, { timeSlot: "desc" }],
  });
  const justBooked = booked && appointments.find((a) => a.bookingCode === booked);

  return (
    <>
      <PageHeader title="My appointments" subtitle="Cancel or reschedule up to 2 hours before your slot">
        <Link href="/patient/book" className="btn-primary">
          Book appointment
        </Link>
      </PageHeader>

      {justBooked && (
        <Alert type="success">
          Appointment confirmed. Your booking ID is <b className="font-mono">{justBooked.bookingCode}</b> for{" "}
          {formatDate(justBooked.date)} at {formatTime(justBooked.timeSlot)} with Dr. {justBooked.doctor.user.name}. A
          confirmation email has been sent.
        </Alert>
      )}

      <div className="card">
        {appointments.length === 0 ? (
          <Empty>You have no appointments yet.</Empty>
        ) : (
          <ul className="divide-y divide-slate-100">
            {appointments.map((a) => (
              <li key={a.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
                <div>
                  <p className="font-medium">
                    {formatDate(a.date)}, {formatTime(a.timeSlot)} <Badge status={a.status} />
                  </p>
                  <p className="text-sm text-slate-600">
                    Dr. {a.doctor.user.name} · {a.doctor.department.name}
                  </p>
                  <p className="font-mono text-xs text-slate-400">{a.bookingCode}</p>
                </div>
                <div className="flex flex-wrap items-start gap-2">
                  {a.prescription && (
                    <Link href={`/print/prescription/${a.id}`} className="btn-secondary btn-sm">
                      Prescription
                    </Link>
                  )}
                  {a.bill && (
                    <Link href={`/print/invoice/${a.bill.id}`} className="btn-secondary btn-sm">
                      Invoice
                    </Link>
                  )}
                  {canModify(a) && (
                    <>
                      <Link href={`/patient/book?reschedule=${a.id}`} className="btn-secondary btn-sm">
                        Reschedule
                      </Link>
                      <CancelForm id={a.id} code={a.bookingCode} />
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
