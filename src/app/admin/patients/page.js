import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { ageFrom, formatDateTime } from "@/lib/format";
import { Empty, PageHeader, TableWrap } from "@/components/ui";

export const metadata = { title: "Patients" };

export default async function PatientsPage({ searchParams }) {
  await requireRole("ADMIN");
  const q = ((await searchParams).q ?? "").trim().slice(0, 100);

  const patients = await prisma.patient.findMany({
    where: q
      ? {
          OR: [
            { user: { name: { contains: q, mode: "insensitive" } } },
            { user: { email: { contains: q, mode: "insensitive" } } },
            { phone: { contains: q } },
          ],
        }
      : undefined,
    include: { user: true, _count: { select: { appointments: true } } },
    orderBy: { user: { createdAt: "desc" } },
    take: 200,
  });

  return (
    <>
      <PageHeader title="Patients" subtitle="All registered patients" />
      <form className="card mb-6 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Search by name, email or phone" className="input max-w-sm flex-1" />
        <button className="btn-primary">Search</button>
        {q && (
          <Link href="/admin/patients" className="btn-secondary">
            Clear
          </Link>
        )}
      </form>
      <div className="card">
        {patients.length === 0 ? (
          <Empty>No patients found.</Empty>
        ) : (
          <TableWrap>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Age / Gender</th>
                  <th>Appointments</th>
                  <th>Registered</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link href={`/admin/patients/${p.id}`} className="link">
                        {p.user.name}
                      </Link>
                    </td>
                    <td>
                      {p.phone}
                      <span className="block text-xs text-slate-500">{p.user.email}</span>
                    </td>
                    <td>
                      {ageFrom(p.dob)} · {p.gender}
                    </td>
                    <td>{p._count.appointments}</td>
                    <td className="whitespace-nowrap text-slate-500">{formatDateTime(p.user.createdAt)}</td>
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
