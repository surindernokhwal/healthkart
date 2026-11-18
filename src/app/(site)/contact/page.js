import Link from "next/link";
import { CLINIC } from "@/lib/clinic";
import { CANCEL_CUTOFF_HOURS, MAX_ADVANCE_DAYS } from "@/lib/slots";
import Icon from "@/components/site/Icon";
import PageHero, { Section } from "@/components/site/PageHero";

export const revalidate = 60;
export const metadata = {
  title: "Contact Us",
  description: "Clinic address, phone number, timings and answers to common questions.",
};

// Answers follow the real rules used by the booking system
const FAQ = [
  {
    q: "How do I book an appointment?",
    a: "Create a free patient account, choose a department and a doctor, pick a date and a free time slot, and confirm. You get a booking ID on screen and by email.",
  },
  {
    q: "How far in advance can I book?",
    a: `You can book any free slot from today up to ${MAX_ADVANCE_DAYS} days ahead. Slots that are already booked, or have already passed, are not shown.`,
  },
  {
    q: "Can I cancel or change my appointment?",
    a: `Yes. Open "My Appointments" and cancel or reschedule. This is allowed until ${CANCEL_CUTOFF_HOURS} hours before the appointment time. A reschedule stays with the same doctor.`,
  },
  {
    q: "How do I pay?",
    a: "Pay the consultation fee at the clinic by cash or UPI. The bill is created automatically after your consultation and is visible in your account.",
  },
  {
    q: "Where can I find my prescription?",
    a: 'After your consultation, the prescription appears under "Prescriptions" in your account. You can print it or save it as a PDF.',
  },
  {
    q: "What if the doctor is on leave?",
    a: "Days when a doctor is on leave are not available for booking. If the clinic has to cancel your appointment, you will be informed by email.",
  },
];

export default function ContactPage() {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${CLINIC.name}, ${CLINIC.address}`)}`;
  const tel = `tel:${CLINIC.phone.replace(/\s/g, "")}`;

  return (
    <>
      <PageHero
        title="Contact Us"
        subtitle="Call us, visit the clinic or book your appointment online."
        crumbs={[{ label: "Contact" }]}
      />

      <Section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ContactCard icon="pin" title="Address">
            <p>{CLINIC.address}</p>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="link mt-2 inline-block text-sm">
              Open in Google Maps
            </a>
          </ContactCard>
          <ContactCard icon="phone" title="Phone">
            <a href={tel} className="font-medium text-slate-900 hover:text-teal-800">
              {CLINIC.phone}
            </a>
            <p className="mt-1 text-sm text-slate-500">During clinic hours</p>
          </ContactCard>
          <ContactCard icon="clock" title="Clinic hours">
            <p>{CLINIC.hours}</p>
            <Link href="/doctors" className="link mt-2 inline-block text-sm">
              Each doctor&apos;s timings
            </Link>
          </ContactCard>
          <ContactCard icon={CLINIC.email ? "mail" : "calendar"} title={CLINIC.email ? "Email" : "Book online"}>
            {CLINIC.email ? (
              <a href={`mailto:${CLINIC.email}`} className="font-medium break-all text-slate-900 hover:text-teal-800">
                {CLINIC.email}
              </a>
            ) : (
              <>
                <p>Available 24×7</p>
                <Link href="/patient/book" className="link mt-2 inline-block text-sm">
                  Book an appointment
                </Link>
              </>
            )}
          </ContactCard>
        </div>

        <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5 text-red-900">
          <h2 className="font-semibold">Medical emergency?</h2>
          <p className="mt-1 text-sm">
            This clinic handles outpatient appointments only. In an emergency, call <strong>112</strong> (or{" "}
            <strong>108</strong> for an ambulance) or go to the nearest hospital straight away.
          </p>
        </div>
      </Section>

      <section className="bg-slate-50">
        <Section title="Frequently asked questions">
          <div className="mx-auto max-w-3xl space-y-3">
            {FAQ.map((f) => (
              <details key={f.q} className="group card p-0">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-medium text-slate-900">
                  {f.q}
                  <span className="text-xl text-teal-700 transition group-open:rotate-45" aria-hidden="true">
                    +
                  </span>
                </summary>
                <p className="px-5 pb-5 text-sm leading-6 text-slate-600">{f.a}</p>
              </details>
            ))}
          </div>
        </Section>
      </section>
    </>
  );
}

function ContactCard({ icon, title, children }) {
  return (
    <div className="card">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
        <Icon name={icon} />
      </span>
      <h2 className="mt-4 font-semibold text-slate-900">{title}</h2>
      <div className="mt-1 text-sm text-slate-700">{children}</div>
    </div>
  );
}
