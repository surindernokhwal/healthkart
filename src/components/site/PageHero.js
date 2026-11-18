import Link from "next/link";

// Title band at the top of every inner page of the website, with breadcrumbs
export default function PageHero({ title, subtitle, crumbs = [], children }) {
  return (
    <section className="border-b border-slate-200 bg-gradient-to-b from-teal-50 to-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <nav aria-label="Breadcrumb" className="mb-3 text-sm text-slate-500">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-teal-800">
                Home
              </Link>
            </li>
            {crumbs.map((c) => (
              <li key={c.label} className="flex items-center gap-1.5">
                <span aria-hidden="true">/</span>
                {c.href ? (
                  <Link href={c.href} className="hover:text-teal-800">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-slate-700">{c.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-3 max-w-2xl text-lg text-slate-600">{subtitle}</p>}
        {children}
      </div>
    </section>
  );
}

export function Section({ title, subtitle, children, className = "" }) {
  return (
    <section className={`mx-auto max-w-6xl px-4 py-12 sm:py-16 ${className}`}>
      {title && <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h2>}
      {subtitle && <p className="mt-2 max-w-2xl text-slate-600">{subtitle}</p>}
      <div className={title || subtitle ? "mt-8" : ""}>{children}</div>
    </section>
  );
}

export function CtaBand({ phone }) {
  return (
    <section className="bg-teal-700">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-12 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Need to see a doctor?</h2>
          <p className="mt-1 text-teal-100">Book online in under a minute, or call us at {phone}.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/patient/book" className="btn bg-white px-6 py-3 text-base text-teal-800 hover:bg-teal-50">
            Book Appointment
          </Link>
          <Link
            href="/doctors"
            className="btn border border-teal-300 px-6 py-3 text-base text-white hover:bg-teal-600"
          >
            Find a Doctor
          </Link>
        </div>
      </div>
    </section>
  );
}
