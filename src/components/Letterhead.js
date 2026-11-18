import { CLINIC } from "@/lib/clinic";

export default function Letterhead({ title }) {
  return (
    <div className="mb-6 flex items-start justify-between border-b-2 border-teal-700 pb-4">
      <div>
        <p className="text-2xl font-bold text-teal-800">{CLINIC.name}</p>
        <p className="text-sm text-slate-600">{CLINIC.address}</p>
        <p className="text-sm text-slate-600">Phone: {CLINIC.phone}</p>
      </div>
      <p className="text-lg font-semibold tracking-wide text-slate-700 uppercase">{title}</p>
    </div>
  );
}
