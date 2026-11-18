import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { canViewAppointment } from "@/lib/access";
import { ageFrom, formatDate, formatDateTime, formatTime, toId } from "@/lib/format";
import Letterhead from "@/components/Letterhead";

export const metadata = { title: "Prescription" };

// Digital prescription (report 5) – printable / Save as PDF
export default async function PrescriptionPrint({ params }) {
  const user = await requireRole();
  const appt = await prisma.appointment.findUnique({
    where: { id: toId((await params).id) },
    include: {
      patient: { include: { user: true } },
      doctor: { include: { user: true, department: true } },
      prescription: { include: { items: { include: { medicine: true } } } },
    },
  });
  if (!appt?.prescription || !(await canViewAppointment(user, appt))) notFound();
  const rx = appt.prescription;

  return (
    <article className="text-sm text-slate-900">
      <Letterhead title="Prescription" />

      <div className="mb-6 flex flex-wrap justify-between gap-4">
        <div>
          <p className="text-base font-semibold">Dr. {appt.doctor.user.name}</p>
          <p className="text-slate-600">{appt.doctor.qualification}</p>
          <p className="text-slate-600">{appt.doctor.department.name}</p>
        </div>
        <div className="text-right">
          <p>
            <span className="text-slate-500">Date:</span> {formatDate(appt.date)}, {formatTime(appt.timeSlot)}
          </p>
          <p>
            <span className="text-slate-500">Booking ID:</span> <span className="font-mono">{appt.bookingCode}</span>
          </p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-4 sm:grid-cols-4 print:bg-white print:ring-1 print:ring-slate-300">
        <p>
          <span className="block text-xs text-slate-500">Patient</span>
          {appt.patient.user.name}
        </p>
        <p>
          <span className="block text-xs text-slate-500">Age / Gender</span>
          {ageFrom(appt.patient.dob)} yrs / {appt.patient.gender}
        </p>
        <p>
          <span className="block text-xs text-slate-500">Phone</span>
          {appt.patient.phone}
        </p>
        <p>
          <span className="block text-xs text-slate-500">Patient ID</span>P-{String(appt.patientId).padStart(5, "0")}
        </p>
      </div>

      <h2 className="mb-1 font-semibold text-slate-700">Diagnosis</h2>
      <p className="mb-6 whitespace-pre-line">{rx.diagnosis}</p>

      <h2 className="mb-2 text-2xl font-serif font-bold text-teal-800">℞</h2>
      <table className="mb-6 w-full border-collapse text-left">
        <thead>
          <tr className="border-b-2 border-slate-300">
            <th className="py-2 pr-2">#</th>
            <th className="py-2 pr-2">Medicine</th>
            <th className="py-2 pr-2">Type</th>
            <th className="py-2 pr-2">Dosage</th>
            <th className="py-2">Duration</th>
          </tr>
        </thead>
        <tbody>
          {rx.items.map((it, i) => (
            <tr key={it.id} className="border-b border-slate-200">
              <td className="py-2 pr-2">{i + 1}</td>
              <td className="py-2 pr-2 font-medium">{it.medicine.name}</td>
              <td className="py-2 pr-2">{it.medicine.type}</td>
              <td className="py-2 pr-2">{it.dosage}</td>
              <td className="py-2">{it.durationDays} days</td>
            </tr>
          ))}
        </tbody>
      </table>

      {rx.advice && (
        <>
          <h2 className="mb-1 font-semibold text-slate-700">Advice</h2>
          <p className="mb-6 whitespace-pre-line">{rx.advice}</p>
        </>
      )}

      <div className="mt-16 flex items-end justify-between">
        <p className="text-xs text-slate-500">Issued {formatDateTime(rx.createdAt)} · Digitally generated prescription</p>
        <div className="text-center">
          <div className="mb-1 w-48 border-b border-slate-400" />
          <p className="font-medium">Dr. {appt.doctor.user.name}</p>
        </div>
      </div>
    </article>
  );
}
