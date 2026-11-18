import Link from "next/link";
import { CLINIC } from "@/lib/clinic";
import { MAX_ADVANCE_DAYS } from "@/lib/slots";
import { DEPARTMENT_INFO, getPublicDepartments, getPublicDoctors } from "@/lib/site";
import DoctorCard from "@/components/site/DoctorCard";
import Icon from "@/components/site/Icon";
import { CtaBand, Section } from "@/components/site/PageHero";

export const revalidate = 60;

const STEPS = [
  { title: "Create your account", text: "Register once with your name, mobile number and email." },
  { title: "Choose a doctor", text: "Pick a department and a doctor, and see their real free time slots." },
  { title: "Book a slot", text: "Confirm the slot. You get a booking ID and a confirmation email." },
  { title: "Visit and get treated", text: "After the visit, your prescription and bill appear in your account." },
];

const FEATURES = [
  { icon: "calendar", title: "Online booking, 24×7", text: `Book up to ${MAX_ADVANCE_DAYS} days ahead. Only free slots are shown, so there is no double booking.` },
  { icon: "doc", title: "Digital prescriptions", text: "Your prescriptions are saved online. Download or print them any time." },
  { icon: "rupee", title: "Clear billing", text: "See every bill and its payment status. Pay by cash or UPI at the clinic." },
  { icon: "bell", title: "Email updates", text: "Get an email when you book, cancel or reschedule an appointment." },
  { icon: "clock", title: "Less waiting", text: "Each patient has a fixed time slot, so you spend less time in the waiting room." },
  { icon: "shield", title: "Private and secure", text: "Your records are visible only to you and your doctor. Passwords are stored encrypted." },
];

export default async function Home() {
  const [departments, doctors] = await Promise.all([getPublicDepartments(), getPublicDoctors()]);

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-teal-50 to-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:py-20 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-teal-100 px-3 py-1 text-sm font-medium text-teal-800">
              <Icon name="calendar" className="h-4 w-4" /> Online appointments now open
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Book your doctor&apos;s appointment online. No queues.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-600">
              {CLINIC.name} brings {doctors.length} experienced doctors across {departments.length} departments
              under one roof. Choose a doctor, pick a free time slot and walk in at your time.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/patient/book" className="btn-primary px-6 py-3 text-base">
                Book Appointment <Icon name="arrow" className="h-4 w-4" />
              </Link>
              <Link href="/doctors" className="btn-secondary px-6 py-3 text-base">
                Find a Doctor
              </Link>
            </div>
          </div>

          <div className="card space-y-4 p-6">
            <h2 className="font-semibold text-slate-900">Visit the clinic</h2>
            <InfoRow icon="clock" label="Timings" value={CLINIC.hours} />
            <InfoRow icon="phone" label="Phone" value={CLINIC.phone} href={`tel:${CLINIC.phone.replace(/\s/g, "")}`} />
            <InfoRow icon="pin" label="Address" value={CLINIC.address} />
            <Link href="/contact" className="link inline-flex items-center gap-1 text-sm">
              Directions and contact <Icon name="arrow" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Numbers */}
      <section className="border-y border-slate-200 bg-white">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 text-center sm:grid-cols-4">
          <Stat value={departments.length} label="Departments" />
          <Stat value={doctors.length} label="Doctors" />
          <Stat value={`${MAX_ADVANCE_DAYS} days`} label="Advance booking" />
          <Stat value="24×7" label="Online booking" />
        </dl>
      </section>

      {/* Departments */}
      <Section title="Our departments" subtitle="Specialist care for the whole family, all in one clinic.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {departments.map((d) => (
            <Link
              key={d.id}
              href={`/departments/${d.id}`}
              className="card group flex flex-col transition hover:border-teal-300 hover:shadow-md"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-50 text-lg font-bold text-teal-700">
                {d.name[0]}
              </span>
              <h3 className="mt-4 font-semibold text-slate-900 group-hover:text-teal-800">{d.name}</h3>
              <p className="mt-1 flex-1 text-sm text-slate-500">
                {DEPARTMENT_INFO[d.name]?.tagline ?? d.description}
              </p>
              <p className="mt-4 text-sm font-medium text-teal-700">
                {d.doctors.length} {d.doctors.length === 1 ? "doctor" : "doctors"} →
              </p>
            </Link>
          ))}
        </div>
      </Section>

      {/* How it works */}
      <section className="bg-slate-50">
        <Section title="How online booking works" subtitle="Four simple steps from home to the doctor's room.">
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="card">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-700 font-semibold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-semibold text-slate-900">{s.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{s.text}</p>
              </li>
            ))}
          </ol>
        </Section>
      </section>

      {/* Doctors */}
      <Section title="Meet our doctors" subtitle="Qualified doctors with fixed weekly timings.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {doctors.slice(0, 4).map((d) => (
            <DoctorCard key={d.id} doctor={d} />
          ))}
        </div>
        {doctors.length > 4 && (
          <div className="mt-6 text-center">
            <Link href="/doctors" className="btn-secondary">
              View all {doctors.length} doctors
            </Link>
          </div>
        )}
      </Section>

      {/* Features */}
      <section className="bg-slate-50">
        <Section title="Why patients choose us" subtitle="Everything about your visit, online and in one place.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="card flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                  <Icon name={f.icon} />
                </span>
                <div>
                  <h3 className="font-semibold text-slate-900">{f.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </section>

      <CtaBand phone={CLINIC.phone} />
    </>
  );
}

function Stat({ value, label }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd className="text-2xl font-bold text-teal-700 sm:text-3xl">{value}</dd>
      <dd className="text-sm text-slate-500">{label}</dd>
    </div>
  );
}

function InfoRow({ icon, label, value, href }) {
  return (
    <div className="flex gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
        <Icon name={icon} className="h-4 w-4" />
      </span>
      <div>
        <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">{label}</p>
        {href ? (
          <a href={href} className="text-sm font-medium text-slate-900 hover:text-teal-800">
            {value}
          </a>
        ) : (
          <p className="text-sm font-medium text-slate-900">{value}</p>
        )}
      </div>
    </div>
  );
}
