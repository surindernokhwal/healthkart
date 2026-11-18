import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { canViewAppointment } from "@/lib/access";
import { billNumber, formatDate, formatDateTime, formatINR, formatTime, toId } from "@/lib/format";
import Letterhead from "@/components/Letterhead";

export const metadata = { title: "Invoice" };

// Invoice / payment receipt (report 6) – printable / Save as PDF
export default async function InvoicePrint({ params }) {
  const user = await requireRole();
  const bill = await prisma.bill.findUnique({
    where: { id: toId((await params).id) },
    include: {
      appointment: {
        include: { patient: { include: { user: true } }, doctor: { include: { user: true, department: true } } },
      },
    },
  });
  if (!bill || !(await canViewAppointment(user, bill.appointment))) notFound();
  const a = bill.appointment;
  const paid = bill.status === "PAID";

  return (
    <article className="text-sm text-slate-900">
      <Letterhead title={paid ? "Payment receipt" : "Invoice"} />

      <div className="mb-8 flex flex-wrap justify-between gap-6">
        <div>
          <p className="text-xs text-slate-500 uppercase">Billed to</p>
          <p className="font-semibold">{a.patient.user.name}</p>
          <p>{a.patient.phone}</p>
          <p>{a.patient.user.email}</p>
          {a.patient.address && <p className="max-w-xs text-slate-600">{a.patient.address}</p>}
        </div>
        <div className="text-right">
          <p>
            <span className="text-slate-500">Bill no.:</span> <span className="font-mono">{billNumber(bill.id)}</span>
          </p>
          <p>
            <span className="text-slate-500">Bill date:</span> {formatDateTime(bill.billDate)}
          </p>
          <p>
            <span className="text-slate-500">Booking ID:</span> <span className="font-mono">{a.bookingCode}</span>
          </p>
        </div>
      </div>

      <table className="mb-6 w-full border-collapse text-left">
        <thead>
          <tr className="border-b-2 border-slate-300">
            <th className="py-2 pr-2">Description</th>
            <th className="py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-slate-200">
            <td className="py-3 pr-2">
              Consultation fee: Dr. {a.doctor.user.name} ({a.doctor.department.name})
              <span className="block text-xs text-slate-500">
                Visit on {formatDate(a.date)}, {formatTime(a.timeSlot)}
              </span>
            </td>
            <td className="py-3 text-right">{formatINR(bill.amount)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td className="py-3 pr-2 text-right font-semibold">Total</td>
            <td className="py-3 text-right text-base font-bold">{formatINR(bill.amount)}</td>
          </tr>
        </tfoot>
      </table>

      <div
        className={`inline-block rounded-lg border-2 px-4 py-2 font-semibold ${
          paid ? "border-green-600 text-green-700" : "border-amber-500 text-amber-700"
        }`}
      >
        {paid ? `PAID by ${bill.mode} on ${formatDateTime(bill.paidAt)}` : "PAYMENT PENDING: pay at the clinic counter"}
      </div>

      <p className="mt-16 text-xs text-slate-500">This is a computer-generated document and does not need a signature.</p>
    </article>
  );
}
