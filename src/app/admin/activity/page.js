import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { formatDateTime } from "@/lib/format";
import { Empty, PageHeader, TableWrap } from "@/components/ui";

export const metadata = { title: "Activity Log" };

export default async function ActivityPage() {
  await requireRole("ADMIN");
  const logs = await prisma.activityLog.findMany({
    include: { user: { select: { name: true, role: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <>
      <PageHeader title="Activity log" subtitle="Latest 200 important actions, for auditing" />
      <div className="card">
        {logs.length === 0 ? (
          <Empty>No activity yet.</Empty>
        ) : (
          <TableWrap>
            <table className="table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td className="whitespace-nowrap text-slate-500">{formatDateTime(l.createdAt)}</td>
                    <td>
                      {l.user ? (
                        <>
                          {l.user.name} <span className="text-xs text-slate-400">({l.user.role.toLowerCase()})</span>
                        </>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="font-mono text-xs">{l.action}</td>
                    <td className="text-slate-600">{l.details}</td>
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
