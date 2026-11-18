"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./Icon";
import { SITE_LINKS } from "./links";

export default function SiteHeader({ clinicName, phone }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-700 text-xl font-bold text-white">
            +
          </span>
          <span className="text-lg font-semibold text-slate-900">{clinicName}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {SITE_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive(l.href) ? "text-teal-800" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login" className="btn-secondary">
            Log in
          </Link>
          <Link href="/patient/book" className="btn-primary">
            Book Appointment
          </Link>
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((o) => !o)}
        >
          <Icon name={open ? "close" : "menu"} className="h-6 w-6" />
        </button>
      </div>

      {open && (
        <div id="mobile-menu" className="border-t border-slate-200 bg-white px-4 pb-4 md:hidden">
          <nav className="flex flex-col py-2" aria-label="Main">
            {SITE_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-2.5 text-base font-medium ${
                  isActive(l.href) ? "bg-teal-50 text-teal-800" : "text-slate-700"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/login" className="btn-secondary" onClick={() => setOpen(false)}>
              Log in
            </Link>
            <Link href="/patient/book" className="btn-primary" onClick={() => setOpen(false)}>
              Book Appointment
            </Link>
          </div>
          <a href={`tel:${phone.replace(/\s/g, "")}`} className="mt-3 flex items-center gap-2 px-3 text-sm text-slate-600">
            <Icon name="phone" className="h-4 w-4" /> {phone}
          </a>
        </div>
      )}
    </header>
  );
}
