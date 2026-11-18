import Link from "next/link";
import { CLINIC } from "@/lib/clinic";
import { getPublicDepartments, getPublicDoctors } from "@/lib/site";
import Icon from "@/components/site/Icon";
import PageHero, { CtaBand, Section } from "@/components/site/PageHero";

export const revalidate = 60;
export const metadata = {
  title: "About Us",
  description: "About the clinic, our approach to care and how we run appointments.",
};

const VALUES = [
  { icon: "user", title: "Patient first", text: "We listen carefully, explain clearly and treat every patient with respect." },
  { icon: "clock", title: "Respect for your time", text: "Fixed appointment slots mean you are seen close to your booked time." },
  { icon: "rupee", title: "Transparent fees", text: "Consultation fees are published on the website. No hidden charges." },
  { icon: "shield", title: "Privacy", text: "Your medical records are visible only to you and the doctor treating you." },
];

const OFFER = [
  "Consultations by appointment in several specialities",
  "Online booking with real-time free slots",
  "Digital prescriptions you can download or print",
  "Your full visit history in one place",
  "Bills online, payment by cash or UPI",
  "Email confirmation for every booking",
];

export default async function AboutPage() {
  const [departments, doctors] = await Promise.all([getPublicDepartments(), getPublicDoctors()]);

  return (
    <>
      <PageHero
        title={`About ${CLINIC.name}`}
        subtitle="Good medical care, close to home, without the long wait."
        crumbs={[{ label: "About Us" }]}
      />

      <Section className="grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Who we are</h2>
          <div className="mt-4 space-y-4 leading-7 text-slate-700">
            <p>
              {CLINIC.name} is a multi-speciality clinic in {CLINIC.address.split(",").slice(-2, -1)[0]?.trim() || "the city"}.
              Our {doctors.length} doctors work across {departments.length} departments:{" "}
              {departments.map((d) => d.name).join(", ")}.
            </p>
            <p>
              Long queues and paper registers make a simple doctor&apos;s visit tiring. We built online booking so
              patients can choose a doctor and a time from home, and we keep prescriptions and bills online so
              nothing gets lost.
            </p>
            <p>
              Our doctors set their own weekly timings, and only genuinely free slots are offered to patients. That
              keeps waiting time short and the day organised for everyone.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="card bg-teal-700 text-white">
            <h3 className="font-semibold">Our mission</h3>
            <p className="mt-2 text-sm leading-6 text-teal-50">
              To make quality outpatient care easy to reach, with respect for every patient&apos;s time and privacy.
            </p>
          </div>
          <div className="card">
            <h3 className="font-semibold text-slate-900">Our vision</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              A clinic where booking, consultation, prescriptions and billing are simple, clear and paper-free.
            </p>
          </div>
          <div className="card sm:col-span-2">
            <h3 className="font-semibold text-slate-900">What we offer</h3>
            <ul className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
              {OFFER.map((o) => (
                <li key={o} className="flex gap-2">
                  <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                  {o}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <section className="bg-slate-50">
        <Section title="Our values">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v) => (
              <div key={v.title} className="card">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                  <Icon name={v.icon} />
                </span>
                <h3 className="mt-4 font-semibold text-slate-900">{v.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{v.text}</p>
              </div>
            ))}
          </div>
        </Section>
      </section>

      <Section title="Our team" subtitle="Meet the doctors who look after our patients.">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {doctors.map((d) => (
            <li key={d.id}>
              <Link href={`/doctors/${d.id}`} className="card block transition hover:border-teal-300">
                <p className="font-semibold text-slate-900">Dr. {d.user.name}</p>
                <p className="text-sm text-slate-500">{d.qualification}</p>
                <p className="mt-1 text-sm text-teal-700">{d.department.name}</p>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <CtaBand phone={CLINIC.phone} />
    </>
  );
}
