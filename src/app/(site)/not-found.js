import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-sm font-semibold text-teal-700">404</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">Page not found</h1>
      <p className="mt-3 text-slate-600">This page does not exist, or the doctor or department is no longer listed.</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/" className="btn-primary">
          Go to home
        </Link>
        <Link href="/doctors" className="btn-secondary">
          See all doctors
        </Link>
      </div>
    </section>
  );
}
