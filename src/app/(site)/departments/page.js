import Link from "next/link";
import { CLINIC } from "@/lib/clinic";
import { DEPARTMENT_INFO, getPublicDepartments } from "@/lib/site";
import Icon from "@/components/site/Icon";
import PageHero, { CtaBand, Section } from "@/components/site/PageHero";

export const revalidate = 60;
export const metadata = {
  title: "Departments",
  description: "Departments and specialist services available at the clinic.",
};

export default async function DepartmentsPage() {
  const departments = await getPublicDepartments();

  return (
    <>
      <PageHero
        title="Departments"
        subtitle="Specialist care for every member of your family. Choose a department to see its services and doctors."
        crumbs={[{ label: "Departments" }]}
      />

      <Section>
        {departments.length === 0 ? (
          <p className="text-slate-500">No departments yet.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {departments.map((d) => {
              const info = DEPARTMENT_INFO[d.name];
              return (
                <article key={d.id} className="card flex flex-col p-6">
                  <div className="flex items-start gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-xl font-bold text-teal-700">
                      {d.name[0]}
                    </span>
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">{d.name}</h2>
                      {d.description && <p className="mt-1 text-sm text-slate-600">{d.description}</p>}
                    </div>
                  </div>

                  {info && (
                    <ul className="mt-5 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                      {info.services.slice(0, 4).map((s) => (
                        <li key={s} className="flex gap-2">
                          <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-5 border-t border-slate-100 pt-4 text-sm text-slate-600">
                    {d.doctors.length === 0
                      ? "Doctors will be added soon."
                      : `Doctors: ${d.doctors.map((doc) => `Dr. ${doc.user.name}`).join(", ")}`}
                  </div>

                  <div className="mt-auto pt-5">
                    <Link href={`/departments/${d.id}`} className="btn-secondary">
                      View department <Icon name="arrow" className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Section>

      <CtaBand phone={CLINIC.phone} />
    </>
  );
}
