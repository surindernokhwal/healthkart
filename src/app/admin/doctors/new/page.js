import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { PageHeader } from "@/components/ui";
import DoctorForm from "../DoctorForm";

export const metadata = { title: "Add Doctor" };

export default async function NewDoctorPage() {
  await requireRole("ADMIN");
  const departments = await prisma.department.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });

  return (
    <>
      <PageHeader title="Add doctor" subtitle="Creates the doctor profile and their login account" />
      <div className="card max-w-3xl">
        {departments.length === 0 ? (
          <p className="text-sm text-slate-600">
            Add a department first.{" "}
            <Link href="/admin/departments" className="link">
              Go to departments
            </Link>
          </p>
        ) : (
          <DoctorForm departments={departments} />
        )}
      </div>
    </>
  );
}
