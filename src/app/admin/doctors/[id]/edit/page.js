import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { toId } from "@/lib/format";
import { PageHeader } from "@/components/ui";
import DoctorForm from "../../DoctorForm";

export const metadata = { title: "Edit Doctor" };

export default async function EditDoctorPage({ params }) {
  await requireRole("ADMIN");
  const { id } = await params;
  const [doctor, departments] = await Promise.all([
    prisma.doctor.findUnique({ where: { id: toId(id) }, include: { user: true } }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!doctor) notFound();

  const values = {
    id: doctor.id,
    name: doctor.user.name,
    email: doctor.user.email,
    departmentId: doctor.departmentId,
    qualification: doctor.qualification,
    phone: doctor.phone,
    fee: Number(doctor.fee),
  };

  return (
    <>
      <PageHeader title={`Edit Dr. ${doctor.user.name}`} />
      <div className="card max-w-3xl">
        <DoctorForm departments={departments} doctor={values} />
      </div>
    </>
  );
}
