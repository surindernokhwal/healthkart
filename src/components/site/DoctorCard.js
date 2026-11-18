import Link from "next/link";
import { formatINR } from "@/lib/format";
import { bookingLink, initials, scheduleSummary } from "@/lib/site";
import Icon from "./Icon";

// Doctor summary used on the home, department and doctors pages
export default function DoctorCard({ doctor, showDepartment = true }) {
  const timings = scheduleSummary(doctor.schedules);

  return (
    <div className="card flex flex-col">
      <div className="flex items-start gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-teal-100 text-lg font-semibold text-teal-800">
          {initials(doctor.user.name)}
        </span>
        <div className="min-w-0">
          <Link href={`/doctors/${doctor.id}`} className="font-semibold text-slate-900 hover:text-teal-800">
            Dr. {doctor.user.name}
          </Link>
          <p className="text-sm text-slate-500">{doctor.qualification}</p>
          {showDepartment && (
            <Link
              href={`/departments/${doctor.department.id}`}
              className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
            >
              {doctor.department.name}
            </Link>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-1.5 text-sm text-slate-600">
        {timings.length === 0 ? (
          <p className="flex items-center gap-2 text-slate-400">
            <Icon name="clock" className="h-4 w-4" /> Timings not announced yet
          </p>
        ) : (
          timings.map((t) => (
            <p key={t.days + t.time} className="flex items-center gap-2">
              <Icon name="clock" className="h-4 w-4 shrink-0 text-teal-700" />
              <span>
                <span className="font-medium text-slate-800">{t.days}</span> · {t.time}
              </span>
            </p>
          ))
        )}
        <p className="flex items-center gap-2">
          <Icon name="rupee" className="h-4 w-4 shrink-0 text-teal-700" />
          Consultation fee: <span className="font-medium text-slate-800">{formatINR(doctor.fee)}</span>
        </p>
      </div>

      <div className="mt-auto flex gap-2 pt-5">
        <Link href={`/doctors/${doctor.id}`} className="btn-secondary flex-1">
          View profile
        </Link>
        {timings.length > 0 && (
          <Link href={bookingLink(doctor)} className="btn-primary flex-1">
            Book
          </Link>
        )}
      </div>
    </div>
  );
}
