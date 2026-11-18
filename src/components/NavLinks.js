"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLinks({ links }) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col">
      {links.map((l) => {
        const active = l.exact ? pathname === l.href : pathname === l.href || pathname.startsWith(l.href + "/");
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition ${
              active ? "bg-teal-50 text-teal-800" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
