import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { toDateStr, todayIST } from "@/lib/time";
import { formatDate, formatTime, toId } from "@/lib/format";
import { Alert, Badge, PageHeader } from "@/components/ui";
import { PatientCard, VisitHistory, getPatientWithHistory } from "@/components/PatientHistory";
import PrescriptionForm from "./PrescriptionForm";

export const metadata = { title: "Consultation" };

// Consultation screen (M5): patient details, previous visits, prescription
export default async function ConsultationPage({ params }) {
  const user = await requireRole("DOCTOR");
  const appt = await prisma.appointment.findUnique({
    where: { id: toId((await params).id) },
    include: { prescription: { include: { items: { include: { medicine: true } } } } },
  });
  if (!appt || appt.doctorId !== user.doctor.id) notFound();

  const [patient, medicines] = await Promise.all([
    getPatientWithHistory(appt.patientId),
    prisma.medicine.findMany({ select: { name: true, type: true }, orderBy: { name: "asc" } }),
  ]);
  const canConsult = appt.status === "CONFIRMED" && toDateStr(appt.date) <= todayIST();

  return (
    <>
      <PageHeader
        title="Consultation"
        subtitle={`${formatDate(appt.date)}, ${formatTime(appt.timeSlot)} · Booking ${appt.bookingCode}`}
      >
        <Badge status={appt.status} />
        <Link href="/doctor" className="btn-secondary">
          Back
        </Link>
      </PageHeader>

      <PatientCard patient={patient} />
      {appt.reason && (
        <p className="mt-3 text-sm">
          <span className="font-medium">Reason for visit:</span> {appt.reason}
        </p>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_400px]">
        <div className="card">
          {appt.status === "COMPLETED" && appt.prescription ? (
            <>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold">Prescription</h2>
                <Link href={`/print/prescription/${appt.id}`} className="btn-secondary btn-sm">
                  Print
                </Link>
              </div>
              <p className="text-sm">
                <span className="font-medium">Diagnosis:</span> {appt.prescription.diagnosis}
              </p>
              <ul className="mt-2 list-inside list-disc text-sm">
                {appt.prescription.items.map((it) => (
                  <li key={it.id}>
                    {it.medicine.name} ({it.medicine.type}): {it.dosage}, {it.durationDays} days
                  </li>
                ))}
              </ul>
              {appt.prescription.advice && (
                <p className="mt-2 text-sm">
                  <span className="font-medium">Advice:</span> {appt.prescription.advice}
                </p>
              )}
            </>
          ) : appt.status === "CANCELLED" ? (
            <Alert type="info">This appointment was cancelled.</Alert>
          ) : canConsult ? (
            <>
              <h2 className="mb-4 font-semibold">Write prescription</h2>
              <PrescriptionForm appointmentId={appt.id} medicines={medicines} />
            </>
          ) : (
            <Alert type="info">You can write the prescription on the appointment date.</Alert>
          )}
        </div>

        <div className="card h-fit">
          <h2 className="font-semibold">Visit history</h2>
          <p className="mb-4 text-xs text-slate-500">All other appointments of this patient, newest first</p>
          <VisitHistory appointments={patient.appointments} excludeId={appt.id} />
        </div>
      </div>
    </>
  );
}
