import Link from "next/link";
import { notFound } from "next/navigation";
import { CLINIC } from "@/lib/clinic";
import { toId } from "@/lib/format";
import { DEPARTMENT_INFO, getPublicDepartment, getPublicDepartments } from "@/lib/site";
import DoctorCard from "@/components/site/DoctorCard";
import Icon from "@/components/site/Icon";
import PageHero, { CtaBand, Section } from "@/components/site/PageHero";

export const revalidate = 60;

// Pre-build a page for every department; new departments are built on first visit
export async function generateStaticParams() {
  const departments = await getPublicDepartments();
  return departments.map((d) => ({ id: String(d.id) }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const dept = await getPublicDepartment(toId(id));
  return dept ? { title: dept.name, description: dept.description ?? undefined } : { title: "Department not found" };
}

export default async function DepartmentPage({ params }) {
  const { id } = await params;
  const dept = await getPublicDepartment(toId(id));
  if (!dept) notFound();

  const info = DEPARTMENT_INFO[dept.name];

  return (
    <>
      <PageHero
        title={dept.name}
        subtitle={info?.tagline ?? dept.description}
        crumbs={[{ label: "Departments", href: "/departments" }, { label: dept.name }]}
      >
        {dept.doctors.length > 0 && (
          <Link href={`/patient/book?dept=${dept.id}`} className="btn-primary mt-6 px-6 py-3 text-base">
            Book in {dept.name}
          </Link>
        )}
      </PageHero>

      <Section className="grid gap-10 lg:grid-cols-[2fr_1fr]">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">About the department</h2>
          <p className="mt-3 leading-7 text-slate-700">
            {dept.description ?? `${dept.name} at ${CLINIC.name}.`} Our doctors see patients by appointment at fixed
            weekly timings, so you can choose a time that suits you and avoid long waits.
          </p>

          {info && (
            <>
              <h3 className="mt-8 text-lg font-semibold text-slate-900">Conditions we treat and services</h3>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {info.services.map((s) => (
                  <li key={s} className="flex gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
                    <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                    {s}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <aside className="card h-fit space-y-4 p-6">
          <h2 className="font-semibold text-slate-900">Visiting information</h2>
          <p className="flex gap-2 text-sm text-slate-700">
            <Icon name="clock" className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
            {CLINIC.hours}
          </p>
          <p className="flex gap-2 text-sm text-slate-700">
            <Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
            {CLINIC.address}
          </p>
          <p className="flex gap-2 text-sm text-slate-700">
            <Icon name="phone" className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
            {CLINIC.phone}
          </p>
          <p className="text-xs text-slate-500">Each doctor&apos;s own timings are shown on their card below.</p>
        </aside>
      </Section>

      <section className="bg-slate-50">
        <Section title={`Doctors in ${dept.name}`}>
          {dept.doctors.length === 0 ? (
            <p className="text-slate-500">Doctors will be added to this department soon.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {dept.doctors.map((d) => (
                <DoctorCard key={d.id} doctor={d} showDepartment={false} />
              ))}
            </div>
          )}
        </Section>
      </section>

      <CtaBand phone={CLINIC.phone} />
    </>
  );
}
