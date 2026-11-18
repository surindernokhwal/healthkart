import Link from "next/link";
import { notFound } from "next/navigation";
import { CLINIC } from "@/lib/clinic";
import { MAX_ADVANCE_DAYS } from "@/lib/slots";
import { WEEKDAYS } from "@/lib/time";
import { formatDate, formatINR, formatTime, toId } from "@/lib/format";
import { bookingLink, getPublicDepartment, getPublicDoctor, getPublicDoctors, initials } from "@/lib/site";
import DoctorCard from "@/components/site/DoctorCard";
import Icon from "@/components/site/Icon";
import PageHero, { CtaBand, Section } from "@/components/site/PageHero";

export const revalidate = 60;

export async function generateStaticParams() {
  const doctors = await getPublicDoctors();
  return doctors.map((d) => ({ id: String(d.id) }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const doctor = await getPublicDoctor(toId(id));
  return doctor
    ? {
        title: `Dr. ${doctor.user.name}`,
        description: `Dr. ${doctor.user.name}, ${doctor.qualification}, ${doctor.department.name}. Timings, fee and online booking.`,
      }
    : { title: "Doctor not found" };
}

// Show Monday first, Sunday last
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export default async function DoctorProfile({ params }) {
  const { id } = await params;
  const doctor = await getPublicDoctor(toId(id));
  if (!doctor) notFound();

  const dept = await getPublicDepartment(doctor.departmentId);
  const colleagues = (dept?.doctors ?? []).filter((d) => d.id !== doctor.id);
  const byDay = new Map(doctor.schedules.map((s) => [s.weekday, s]));
  const canBook = doctor.schedules.length > 0;

  return (
    <>
      <PageHero
        title={`Dr. ${doctor.user.name}`}
        crumbs={[{ label: "Doctors", href: "/doctors" }, { label: `Dr. ${doctor.user.name}` }]}
      >
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-teal-100 text-2xl font-semibold text-teal-800">
            {initials(doctor.user.name)}
          </span>
          <div>
            <p className="text-lg text-slate-700">{doctor.qualification}</p>
            <Link href={`/departments/${doctor.department.id}`} className="link">
              {doctor.department.name}
            </Link>
          </div>
        </div>
      </PageHero>

      <Section className="grid gap-10 lg:grid-cols-[2fr_1fr]">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Weekly timings</h2>
          <p className="mt-1 text-sm text-slate-500">Appointments are given in fixed time slots within these hours.</p>
          <div className="card mt-5 overflow-hidden p-0">
            <table className="table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Timings</th>
                  <th className="hidden sm:table-cell">Slot length</th>
                </tr>
              </thead>
              <tbody>
                {WEEK_ORDER.map((day) => {
                  const s = byDay.get(day);
                  return (
                    <tr key={day} className={s ? "" : "text-slate-400"}>
                      <td className="font-medium">{WEEKDAYS[day]}</td>
                      <td>{s ? `${formatTime(s.startTime)} – ${formatTime(s.endTime)}` : "Not available"}</td>
                      <td className="hidden sm:table-cell">{s ? `${s.slotMinutes} min` : "–"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {doctor.leaves.length > 0 && (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <h3 className="font-semibold text-amber-900">On leave (next 30 days)</h3>
              <ul className="mt-2 space-y-1 text-sm text-amber-900">
                {doctor.leaves.map((l) => (
                  <li key={l.id}>
                    {formatDate(l.leaveDate)}
                    {l.reason ? ` – ${l.reason}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <aside className="card h-fit space-y-4 p-6">
          <div>
            <p className="text-sm text-slate-500">Consultation fee</p>
            <p className="text-3xl font-bold text-slate-900">{formatINR(doctor.fee)}</p>
            <p className="mt-1 text-xs text-slate-500">Pay at the clinic by cash or UPI.</p>
          </div>
          {canBook ? (
            <>
              <Link href={bookingLink(doctor)} className="btn-primary w-full py-3 text-base">
                Book Appointment
              </Link>
              <p className="text-xs text-slate-500">
                Free slots are shown for the next {MAX_ADVANCE_DAYS} days. You will need to log in or register.
              </p>
            </>
          ) : (
            <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              Online booking opens once this doctor&apos;s timings are announced. Please call {CLINIC.phone}.
            </p>
          )}
          <div className="space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-700">
            <p className="flex gap-2">
              <Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
              {CLINIC.address}
            </p>
            <p className="flex gap-2">
              <Icon name="phone" className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
              {CLINIC.phone}
            </p>
          </div>
        </aside>
      </Section>

      {colleagues.length > 0 && (
        <section className="bg-slate-50">
          <Section title={`Other doctors in ${doctor.department.name}`}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {colleagues.map((d) => (
                <DoctorCard key={d.id} doctor={d} showDepartment={false} />
              ))}
            </div>
          </Section>
        </section>
      )}

      <CtaBand phone={CLINIC.phone} />
    </>
  );
}
