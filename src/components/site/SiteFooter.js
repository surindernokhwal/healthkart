import Link from "next/link";
import { CLINIC } from "@/lib/clinic";
import Icon from "./Icon";
import { SITE_LINKS } from "./links";

export default function SiteFooter({ departments }) {
  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 text-xl font-bold text-white">
              +
            </span>
            <span className="text-lg font-semibold text-white">{CLINIC.name}</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            A neighbourhood clinic with experienced doctors, online appointment booking and digital
            prescriptions.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-white">Quick links</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {SITE_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/register" className="hover:text-white">
                Patient registration
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-white">Departments</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {departments.map((d) => (
              <li key={d.id}>
                <Link href={`/departments/${d.id}`} className="hover:text-white">
                  {d.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-white">Contact</h2>
          <ul className="mt-3 space-y-3 text-sm">
            <li className="flex gap-2">
              <Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" />
              {CLINIC.address}
            </li>
            <li className="flex gap-2">
              <Icon name="phone" className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" />
              <a href={`tel:${CLINIC.phone.replace(/\s/g, "")}`} className="hover:text-white">
                {CLINIC.phone}
              </a>
            </li>
            {CLINIC.email && (
              <li className="flex gap-2">
                <Icon name="mail" className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" />
                <a href={`mailto:${CLINIC.email}`} className="hover:text-white">
                  {CLINIC.email}
                </a>
              </li>
            )}
            <li className="flex gap-2">
              <Icon name="clock" className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" />
              {CLINIC.hours}
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-800 py-5 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} {CLINIC.name}. In a medical emergency, call 112 or go to the nearest hospital.
      </div>
    </footer>
  );
}
