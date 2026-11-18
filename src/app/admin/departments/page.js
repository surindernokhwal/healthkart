import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { toggleDepartment } from "@/actions/admin";
import { Badge, Empty, PageHeader, TableWrap } from "@/components/ui";
import DepartmentForm from "./DepartmentForm";

export const metadata = { title: "Departments" };

export default async function DepartmentsPage({ searchParams }) {
  await requireRole("ADMIN");
  const { edit } = await searchParams;

  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { doctors: true } } },
  });
  const editing = departments.find((d) => d.id === Number(edit)); // safe: in-memory lookup

  return (
    <>
      <PageHeader title="Departments" subtitle="Departments patients can choose when booking" />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="card">
          {departments.length === 0 ? (
            <Empty>No departments yet. Add the first one.</Empty>
          ) : (
            <TableWrap>
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Doctors</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <p className="font-medium">{d.name}</p>
                        {d.description && <p className="text-xs text-slate-500">{d.description}</p>}
                      </td>
                      <td>{d._count.doctors}</td>
                      <td>
                        <Badge status={d.isActive ? "ACTIVE" : "INACTIVE"} />
                      </td>
                      <td>
                        <div className="flex justify-end gap-2">
                          <Link href={`/admin/departments?edit=${d.id}`} className="btn-secondary btn-sm">
                            Edit
                          </Link>
                          <form action={toggleDepartment}>
                            <input type="hidden" name="id" value={d.id} />
                            <button className={d.isActive ? "btn-danger btn-sm" : "btn-secondary btn-sm"}>
                              {d.isActive ? "Deactivate" : "Activate"}
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

        <div className="card h-fit">
          <h2 className="mb-4 font-semibold">{editing ? `Edit: ${editing.name}` : "Add department"}</h2>
          <DepartmentForm key={editing?.id ?? "new"} department={editing} />
          {editing && (
            <Link href="/admin/departments" className="link mt-3 inline-block text-sm">
              Cancel editing
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
