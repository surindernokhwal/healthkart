import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { REPORT_TYPES, buildReport, defaultRange, toCSV } from "@/lib/reports";
import { isValidDateStr } from "@/lib/time";
import { logActivity } from "@/lib/activity";

// CSV export of any admin report (FR-06)
export async function GET(request) {
  const session = await auth();
  const user = session?.user?.id
    ? await prisma.user.findUnique({ where: { id: Number(session.user.id) } })
    : null;
  if (!user || !user.isActive || user.role !== "ADMIN") {
    return new Response("Forbidden", { status: 403 });
  }

  const sp = request.nextUrl.searchParams;
  const type = REPORT_TYPES[sp.get("type")] ? sp.get("type") : "appointments";
  const def = defaultRange();
  let from = isValidDateStr(sp.get("from")) ? sp.get("from") : def.from;
  let to = isValidDateStr(sp.get("to")) ? sp.get("to") : def.to;
  if (from > to) [from, to] = [to, from];

  const report = await buildReport(type, from, to);
  await logActivity(user.id, "REPORT_EXPORT", `${type} ${from}..${to}`);

  return new Response(toCSV(report), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${type}_${from}_${to}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
