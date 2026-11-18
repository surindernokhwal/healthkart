import Link from "next/link";
import { CLINIC } from "@/lib/clinic";

export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-teal-50 to-slate-50 px-4 py-10">
      <Link href="/" className="mb-6 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-700 text-xl font-bold text-white">
          +
        </span>
        <span className="text-lg font-semibold text-slate-900">{CLINIC.name}</span>
      </Link>
      {children}
    </div>
  );
}
