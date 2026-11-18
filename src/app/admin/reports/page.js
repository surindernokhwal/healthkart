import { requireRole } from "@/lib/session";
import { REPORT_TYPES, buildReport, defaultRange } from "@/lib/reports";
import { isValidDateStr } from "@/lib/time";
import { formatDate } from "@/lib/format";
import { CLINIC } from "@/lib/clinic";
import { Empty, PageHeader, TableWrap } from "@/components/ui";
import BarChartCard from "@/components/BarChartCard";
import PrintButton from "@/components/PrintButton";

export const metadata = { title: "Reports" };

const MONEY_COLUMNS = new Set(["revenue", "cash", "upi", "total", "amount"]);

export default async function ReportsPage({ searchParams }) {
  await requireRole("ADMIN");
  const sp = await searchParams;
  const type = REPORT_TYPES[sp.type] ? sp.type : "appointments";
  const def = defaultRange();
  let from = isValidDateStr(sp.from) ? sp.from : def.from;
  let to = isValidDateStr(sp.to) ? sp.to : def.to;
  if (from > to) [from, to] = [to, from];

  const report = await buildReport(type, from, to);
  const query = new URLSearchParams({ type, from, to }).toString();
  const isMoneyChart = type.startsWith("revenue");

  return (
    <>
      <div className="no-print">
        <PageHeader title="Reports" subtitle="Choose a report and a date range" />
        <form className="card mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto]">
          <select name="type" defaultValue={type} className="input" aria-label="Report">
            {Object.entries(REPORT_TYPES).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
          <input type="date" name="from" defaultValue={from} className="input" aria-label="From" />
          <input type="date" name="to" defaultValue={to} className="input" aria-label="To" />
          <button className="btn-primary">Generate</button>
        </form>
      </div>

      <div className="card">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="hidden text-sm text-slate-500 print:block">{CLINIC.name}</p>
            <h2 className="text-lg font-semibold">{report.title}</h2>
            <p className="text-sm text-slate-500">
              {formatDate(from)} to {formatDate(to)} · {report.summary}
            </p>
          </div>
          <div className="no-print flex gap-2">
            <a href={`/admin/reports/export?${query}`} className="btn-secondary">
              Export CSV
            </a>
            <PrintButton label="Print" />
          </div>
        </div>

        {report.chart && report.rows.length > 0 && (
          <div className="mb-6">
            <BarChartCard {...report.chart} money={isMoneyChart} />
          </div>
        )}

        {report.rows.length === 0 ? (
          <Empty>No records for this period.</Empty>
        ) : (
          <TableWrap>
            <table className="table">
              <thead>
                <tr>
                  {report.columns.map((c) => (
                    <th key={c.key}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.rows.map((row, i) => (
                  <tr key={i}>
                    {report.columns.map((c) => (
                      <td key={c.key} className={MONEY_COLUMNS.has(c.key) ? "whitespace-nowrap" : undefined}>
                        {MONEY_COLUMNS.has(c.key) ? Number(row[c.key]).toLocaleString("en-IN") : row[c.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </div>
    </>
  );
}
