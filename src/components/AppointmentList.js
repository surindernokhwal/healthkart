import Link from "next/link";
import { ageFrom, formatDate, formatTime } from "@/lib/format";
import { Badge, Empty, TableWrap } from "./ui";

// Doctor's appointment table (FR-09)
export default function AppointmentList({ appointments, showDate = false, emptyText = "No appointments." }) {
  if (!appointments.length) return <Empty>{emptyText}</Empty>;
  return (
    <TableWrap>
      <table className="table">
        <thead>
          <tr>
            {showDate && <th>Date</th>}
            <th>Time</th>
            <th>Patient</th>
            <th>Reason</th>
            <th>Status</th>
            <th className="text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((a) => (
            <tr key={a.id}>
              {showDate && <td className="whitespace-nowrap">{formatDate(a.date)}</td>}
              <td className="whitespace-nowrap font-medium">{formatTime(a.timeSlot)}</td>
              <td>
                {a.patient.user.name}
                <span className="block text-xs text-slate-500">
                  {ageFrom(a.patient.dob)} yrs · {a.patient.gender} · {a.patient.phone}
                </span>
              </td>
              <td className="max-w-xs text-slate-600">{a.reason || "-"}</td>
              <td>
                <Badge status={a.status} />
              </td>
              <td className="text-right">
                {a.status !== "CANCELLED" && (
                  <Link
                    href={`/doctor/appointments/${a.id}`}
                    className={a.status === "CONFIRMED" ? "btn-primary btn-sm" : "btn-secondary btn-sm"}
                  >
                    {a.status === "CONFIRMED" ? "Consult" : "View"}
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
  );
}
