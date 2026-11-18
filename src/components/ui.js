// Small presentational components (usable from server and client components)

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

const STATUS_STYLES = {
  CONFIRMED: "bg-blue-50 text-blue-700 ring-blue-600/20",
  COMPLETED: "bg-green-50 text-green-700 ring-green-600/20",
  CANCELLED: "bg-slate-100 text-slate-600 ring-slate-500/20",
  PENDING: "bg-amber-50 text-amber-700 ring-amber-600/20",
  PAID: "bg-green-50 text-green-700 ring-green-600/20",
  ACTIVE: "bg-green-50 text-green-700 ring-green-600/20",
  INACTIVE: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

export function Badge({ status, children }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
        STATUS_STYLES[status] ?? STATUS_STYLES.INACTIVE
      }`}
    >
      {children ?? status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

export function StatCard({ label, value, hint }) {
  return (
    <div className="card">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export function Empty({ children }) {
  return <p className="py-8 text-center text-sm text-slate-500">{children}</p>;
}

export function Field({ label, error, children, className = "" }) {
  return (
    <div className={className}>
      {label && <label className="label">{label}</label>}
      {children}
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}

export function Alert({ type = "error", children }) {
  if (!children) return null;
  const style =
    type === "success"
      ? "border-green-200 bg-green-50 text-green-800"
      : type === "info"
        ? "border-blue-200 bg-blue-50 text-blue-800"
        : "border-red-200 bg-red-50 text-red-800";
  return <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${style}`}>{children}</div>;
}

export function TableWrap({ children }) {
  return <div className="-mx-5 overflow-x-auto px-5">{children}</div>;
}

// Placeholder shown by loading.js while a page fetches its data, so clicking a
// menu item gives instant feedback instead of a frozen screen.
export function PageSkeleton() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="mb-2 h-7 w-56 rounded bg-slate-200" />
      <div className="mb-6 h-4 w-40 rounded bg-slate-100" />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 rounded-xl border border-slate-200 bg-white" />
        ))}
      </div>
      <div className="h-64 rounded-xl border border-slate-200 bg-white" />
    </div>
  );
}
