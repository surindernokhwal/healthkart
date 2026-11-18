import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { billNumber, formatDateTime, formatINR, toId } from "@/lib/format";
import { Badge, Empty, PageHeader, StatCard, TableWrap } from "@/components/ui";
import MarkPaidForm from "./MarkPaidForm";

export const metadata = { title: "Bills" };

export default async function BillsPage({ searchParams }) {
  await requireRole("ADMIN");
  const sp = await searchParams;
  const status = ["PENDING", "PAID"].includes(sp.status) ? sp.status : "";
  const q = (sp.q ?? "").trim().slice(0, 100);
  const billId = toId(q.replace(/^INV-/i, ""));

  const [bills, pending, paid] = await Promise.all([
    prisma.bill.findMany({
      where: {
        ...(status && { status }),
        ...(q && {
          OR: [
            ...(billId ? [{ id: billId }] : []),
            { appointment: { bookingCode: { contains: q, mode: "insensitive" } } },
            { appointment: { patient: { user: { name: { contains: q, mode: "insensitive" } } } } },
          ],
        }),
      },
      include: {
        appointment: { include: { patient: { include: { user: true } }, doctor: { include: { user: true } } } },
      },
      orderBy: [{ status: "asc" }, { billDate: "desc" }],
      take: 200,
    }),
    prisma.bill.aggregate({ where: { status: "PENDING" }, _sum: { amount: true }, _count: true }),
    prisma.bill.aggregate({ where: { status: "PAID" }, _sum: { amount: true }, _count: true }),
  ]);

  return (
    <>
      <PageHeader title="Bills" subtitle="Bills are created automatically when a consultation is completed" />
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard label={`Pending (${pending._count})`} value={formatINR(pending._sum.amount)} />
        <StatCard label={`Collected (${paid._count})`} value={formatINR(paid._sum.amount)} />
      </div>

      <form className="card mb-6 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Bill no., booking ID or patient" className="input max-w-xs flex-1" />
        <select name="status" defaultValue={status} className="input w-auto">
          <option value="">All bills</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
        </select>
        <button className="btn-primary">Filter</button>
        <Link href="/admin/bills" className="btn-secondary">
          Reset
        </Link>
      </form>

      <div className="card">
        {bills.length === 0 ? (
          <Empty>No bills found.</Empty>
        ) : (
          <TableWrap>
            <table className="table">
              <thead>
                <tr>
                  <th>Bill</th>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((b) => (
                  <tr key={b.id}>
                    <td className="whitespace-nowrap">
                      <Link href={`/print/invoice/${b.id}`} className="link font-mono text-xs">
                        {billNumber(b.id)}
                      </Link>
                      <span className="block text-xs text-slate-500">{formatDateTime(b.billDate)}</span>
                    </td>
                    <td>{b.appointment.patient.user.name}</td>
                    <td>Dr. {b.appointment.doctor.user.name}</td>
                    <td className="whitespace-nowrap font-medium">{formatINR(b.amount)}</td>
                    <td>
                      <Badge status={b.status} />
                    </td>
                    <td>
                      {b.status === "PENDING" ? (
                        <MarkPaidForm billId={b.id} />
                      ) : (
                        <span className="text-xs text-slate-600">
                          {b.mode} · {formatDateTime(b.paidAt)}
                        </span>
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
