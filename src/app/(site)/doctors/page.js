import { CLINIC } from "@/lib/clinic";
import { getPublicDepartments } from "@/lib/site";
import DoctorCard from "@/components/site/DoctorCard";
import PageHero, { CtaBand, Section } from "@/components/site/PageHero";

export const revalidate = 60;
export const metadata = {
  title: "Our Doctors",
  description: "Doctors, their qualifications, weekly timings and consultation fees.",
};

export default async function DoctorsPage() {
  const departments = (await getPublicDepartments()).filter((d) => d.doctors.length > 0);
  const total = departments.reduce((n, d) => n + d.doctors.length, 0);

  return (
    <>
      <PageHero
        title="Our Doctors"
        subtitle={`${total} qualified doctors with fixed weekly timings. Check a doctor's timings and fee, then book a free slot online.`}
        crumbs={[{ label: "Doctors" }]}
      >
        {departments.length > 1 && (
          <nav aria-label="Jump to department" className="mt-6 flex flex-wrap gap-2">
            {departments.map((d) => (
              <a
                key={d.id}
                href={`#dept-${d.id}`}
                className="rounded-full border border-teal-200 bg-white px-3 py-1.5 text-sm font-medium text-teal-800 hover:bg-teal-50"
              >
                {d.name} ({d.doctors.length})
              </a>
            ))}
          </nav>
        )}
      </PageHero>

      {departments.length === 0 && (
        <Section>
          <p className="text-slate-500">No doctors yet.</p>
        </Section>
      )}

      {departments.map((d, i) => (
        <section key={d.id} id={`dept-${d.id}`} className={`scroll-mt-20 ${i % 2 ? "bg-slate-50" : ""}`}>
          <Section title={d.name} subtitle={d.description}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {d.doctors.map((doc) => (
                <DoctorCard key={doc.id} doctor={doc} showDepartment={false} />
              ))}
            </div>
          </Section>
        </section>
      ))}

      <CtaBand phone={CLINIC.phone} />
    </>
  );
}
