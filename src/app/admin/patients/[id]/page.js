import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/session";
import { toId } from "@/lib/format";
import { PageHeader } from "@/components/ui";
import { PatientCard, VisitHistory, getPatientWithHistory } from "@/components/PatientHistory";

export const metadata = { title: "Patient History" };

export default async function AdminPatientPage({ params }) {
  await requireRole("ADMIN");
  const patient = await getPatientWithHistory(toId((await params).id));
  if (!patient) notFound();

  return (
    <>
      <PageHeader title="Patient visit history">
        <Link href="/admin/patients" className="btn-secondary">
          Back to patients
        </Link>
      </PageHeader>
      <PatientCard patient={patient} />
      <div className="card mt-6">
        <h2 className="mb-4 font-semibold">Visits</h2>
        <VisitHistory
          appointments={patient.appointments}
          linkFor={(a) =>
            a.bill && (
              <Link href={`/print/invoice/${a.bill.id}`} className="link text-xs">
                Invoice
              </Link>
            )
          }
        />
      </div>
    </>
  );
}
