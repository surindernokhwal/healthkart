import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { toggleDoctor } from "@/actions/admin";
import { formatINR } from "@/lib/format";
import { WEEKDAYS } from "@/lib/time";
import { Badge, Empty, PageHeader, TableWrap } from "@/components/ui";

export const metadata = { title: "Doctors" };

export default async function DoctorsPage() {
  await requireRole("ADMIN");
  const doctors = await prisma.doctor.findMany({
    include: { user: true, department: true, schedules: { orderBy: { weekday: "asc" } } },
    orderBy: { user: { name: "asc" } },
  });

  return (
    <>
      <PageHeader title="Doctors" subtitle="Doctor profiles, fees and login accounts">
        <Link href="/admin/doctors/new" className="btn-primary">
          Add doctor
        </Link>
      </PageHeader>
      <div className="card">
        {doctors.length === 0 ? (
          <Empty>No doctors yet.</Empty>
        ) : (
          <TableWrap>
            <table className="table">
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Department</th>
                  <th>Fee</th>
                  <th>Working days</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <p className="font-medium">Dr. {d.user.name}</p>
                      <p className="text-xs text-slate-500">
                        {d.qualification} · {d.user.email} · {d.phone}
                      </p>
                    </td>
                    <td>{d.department.name}</td>
                    <td className="whitespace-nowrap">{formatINR(d.fee)}</td>
                    <td className="text-xs text-slate-600">
                      {d.schedules.length
                        ? d.schedules.map((s) => WEEKDAYS[s.weekday].slice(0, 3)).join(", ")
                        : <span className="text-amber-700">Not set</span>}
                    </td>
                    <td>
                      <Badge status={d.user.isActive ? "ACTIVE" : "INACTIVE"} />
                    </td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/doctors/${d.id}/edit`} className="btn-secondary btn-sm">
                          Edit
                        </Link>
                        <form action={toggleDoctor}>
                          <input type="hidden" name="id" value={d.id} />
                          <button className={d.user.isActive ? "btn-danger btn-sm" : "btn-secondary btn-sm"}>
                            {d.user.isActive ? "Deactivate" : "Activate"}
                          </button>
                        </form>
                      </div>
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
