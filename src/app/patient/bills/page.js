import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { billNumber, formatDate, formatDateTime, formatINR } from "@/lib/format";
import { Badge, Empty, PageHeader, TableWrap } from "@/components/ui";

export const metadata = { title: "Bills" };

export default async function MyBills() {
  const user = await requireRole("PATIENT");
  const bills = await prisma.bill.findMany({
    where: { appointment: { patientId: user.patient.id } },
    include: { appointment: { include: { doctor: { include: { user: true } } } } },
    orderBy: { billDate: "desc" },
  });

  return (
    <>
      <PageHeader title="Bills" subtitle="Pending bills can be paid at the clinic counter by cash or UPI" />
      <div className="card">
        {bills.length === 0 ? (
          <Empty>No bills yet. A bill is created after your consultation.</Empty>
        ) : (
          <TableWrap>
            <table className="table">
              <thead>
                <tr>
                  <th>Bill</th>
                  <th>Visit</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {bills.map((b) => (
                  <tr key={b.id}>
                    <td className="whitespace-nowrap">
                      <span className="font-mono text-xs">{billNumber(b.id)}</span>
                      <span className="block text-xs text-slate-500">{formatDateTime(b.billDate)}</span>
                    </td>
                    <td>
                      {formatDate(b.appointment.date)} · Dr. {b.appointment.doctor.user.name}
                    </td>
                    <td className="font-medium whitespace-nowrap">{formatINR(b.amount)}</td>
                    <td>
                      <Badge status={b.status} />
                      {b.mode && <span className="ml-1 text-xs text-slate-500">{b.mode}</span>}
                    </td>
                    <td className="text-right">
                      <Link href={`/print/invoice/${b.id}`} className="btn-secondary btn-sm">
                        Invoice
                      </Link>
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
