import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { PageHeader } from "@/components/ui";
import { VisitHistory } from "@/components/PatientHistory";

export const metadata = { title: "Prescriptions" };

// Patient's own visit history with prescriptions (FR-16, report 4)
export default async function MyPrescriptions() {
  const user = await requireRole("PATIENT");
  const appointments = await prisma.appointment.findMany({
    where: { patientId: user.patient.id, status: "COMPLETED" },
    orderBy: [{ date: "desc" }, { timeSlot: "desc" }],
    include: {
      doctor: { include: { user: true, department: true } },
      prescription: { include: { items: { include: { medicine: true } } } },
    },
  });

  return (
    <>
      <PageHeader title="Prescriptions" subtitle="Your visit history. Open any prescription to print or save it as PDF." />
      <div className="card">
        <VisitHistory appointments={appointments} />
      </div>
    </>
  );
}
