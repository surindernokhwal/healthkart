import Link from "next/link";
import PrintButton from "@/components/PrintButton";
import { requireRole } from "@/lib/session";

export default async function PrintLayout({ children }) {
  await requireRole();
  return (
    <div className="min-h-screen bg-slate-100 py-6 print:bg-white print:py-0">
      <div className="no-print mx-auto mb-4 flex max-w-3xl justify-between px-4">
        <Link href="/dashboard" className="btn-secondary">
          Back to dashboard
        </Link>
        <PrintButton />
      </div>
      <div className="mx-auto max-w-3xl bg-white p-8 shadow-sm print:max-w-none print:p-0 print:shadow-none">
        {children}
      </div>
    </div>
  );
}
