import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ageFrom, formatDate, formatTime } from "@/lib/format";
import { Badge, Empty } from "./ui";

export async function getPatientWithHistory(patientId) {
  return prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      user: true,
      appointments: {
        orderBy: [{ date: "desc" }, { timeSlot: "desc" }],
        include: {
          doctor: { include: { user: true, department: true } },
          prescription: { include: { items: { include: { medicine: true } } } },
          bill: true,
        },
      },
    },
  });
}

export function PatientCard({ patient }) {
  return (
    <div className="card">
      <h2 className="text-lg font-semibold">{patient.user.name}</h2>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-slate-500">Age / Gender</dt>
          <dd>
            {ageFrom(patient.dob)} yrs · {patient.gender}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Date of birth</dt>
          <dd>{formatDate(patient.dob)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Phone</dt>
          <dd>{patient.phone}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Email</dt>
          <dd className="break-all">{patient.user.email}</dd>
        </div>
        {patient.address && (
          <div className="col-span-2 sm:col-span-4">
            <dt className="text-slate-500">Address</dt>
            <dd>{patient.address}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

// Visit and prescription history (FR-10, report 4)
export function VisitHistory({ appointments, excludeId, linkFor }) {
  const visits = appointments.filter((a) => a.id !== excludeId && a.status !== "CANCELLED");
  if (!visits.length) return <Empty>No previous visits.</Empty>;

  return (
    <ol className="space-y-4">
      {visits.map((a) => (
        <li key={a.id} className="rounded-lg border border-slate-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">
              {formatDate(a.date)}, {formatTime(a.timeSlot)}
              <span className="font-normal text-slate-500">
                {" "}
                · Dr. {a.doctor.user.name} ({a.doctor.department.name})
              </span>
            </p>
            <div className="flex items-center gap-2">
              <Badge status={a.status} />
              {linkFor && linkFor(a)}
            </div>
          </div>
          {a.reason && <p className="mt-1 text-sm text-slate-500">Reason: {a.reason}</p>}
          {a.prescription && (
            <div className="mt-3 text-sm">
              <p>
                <span className="font-medium">Diagnosis:</span> {a.prescription.diagnosis}
              </p>
              <ul className="mt-1 list-inside list-disc text-slate-700">
                {a.prescription.items.map((it) => (
                  <li key={it.id}>
                    {it.medicine.name} ({it.medicine.type}): {it.dosage}, {it.durationDays} days
                  </li>
                ))}
              </ul>
              {a.prescription.advice && (
                <p className="mt-1">
                  <span className="font-medium">Advice:</span> {a.prescription.advice}
                </p>
              )}
              <Link href={`/print/prescription/${a.id}`} className="link mt-2 inline-block text-xs">
                View / print prescription
              </Link>
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
