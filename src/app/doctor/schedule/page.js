import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { dateOnly, todayIST } from "@/lib/time";
import { formatDate } from "@/lib/format";
import { deleteLeave } from "@/actions/doctor";
import { Empty, PageHeader } from "@/components/ui";
import ScheduleForm from "./ScheduleForm";
import LeaveForm from "./LeaveForm";

export const metadata = { title: "Schedule & Leave" };

export default async function SchedulePage() {
  const user = await requireRole("DOCTOR");
  const doctorId = user.doctor.id;
  const [schedules, leaves] = await Promise.all([
    prisma.doctorSchedule.findMany({ where: { doctorId } }),
    prisma.doctorLeave.findMany({
      where: { doctorId, leaveDate: { gte: dateOnly(todayIST()) } },
      orderBy: { leaveDate: "asc" },
    }),
  ]);

  const initial = Array.from({ length: 7 }, (_, weekday) => {
    const s = schedules.find((x) => x.weekday === weekday);
    return s
      ? { works: true, start: s.startTime, end: s.endTime, slot: s.slotMinutes }
      : { works: false, start: "10:00", end: "14:00", slot: 15 };
  });

  return (
    <>
      <PageHeader
        title="Schedule & leave"
        subtitle="Patients can book only inside your working hours, and never on leave dates"
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="card">
          <h2 className="mb-4 font-semibold">Weekly availability</h2>
          <ScheduleForm initial={initial} />
        </div>
        <div className="card h-fit">
          <h2 className="mb-4 font-semibold">Leave dates</h2>
          <LeaveForm />
          <div className="mt-5 border-t border-slate-200 pt-4">
            {leaves.length === 0 ? (
              <Empty>No upcoming leave.</Empty>
            ) : (
              <ul className="divide-y divide-slate-100">
                {leaves.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                    <span>
                      <span className="font-medium">{formatDate(l.leaveDate)}</span>
                      {l.reason && <span className="text-slate-500"> · {l.reason}</span>}
                    </span>
                    <form action={deleteLeave}>
                      <input type="hidden" name="id" value={l.id} />
                      <button className="text-xs text-red-700 hover:underline">Remove</button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
