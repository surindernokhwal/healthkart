import Link from "next/link";
import NavLinks from "./NavLinks";
import { logoutAction } from "@/actions/auth";
import { CLINIC } from "@/lib/clinic";

const NAV = {
  ADMIN: [
    { href: "/admin", label: "Dashboard", exact: true },
    { href: "/admin/appointments", label: "Appointments" },
    { href: "/admin/patients", label: "Patients" },
    { href: "/admin/doctors", label: "Doctors" },
    { href: "/admin/departments", label: "Departments" },
    { href: "/admin/bills", label: "Bills" },
    { href: "/admin/reports", label: "Reports" },
    { href: "/admin/activity", label: "Activity Log" },
    { href: "/account", label: "Account" },
  ],
  DOCTOR: [
    { href: "/doctor", label: "Today", exact: true },
    { href: "/doctor/appointments", label: "Appointments" },
    { href: "/doctor/schedule", label: "Schedule & Leave" },
    { href: "/account", label: "Account" },
  ],
  PATIENT: [
    { href: "/patient", label: "Home", exact: true },
    { href: "/patient/book", label: "Book Appointment" },
    { href: "/patient/appointments", label: "My Appointments" },
    { href: "/patient/prescriptions", label: "Prescriptions" },
    { href: "/patient/bills", label: "Bills" },
    { href: "/patient/profile", label: "Profile" },
    { href: "/account", label: "Password" },
  ],
};

const ROLE_LABEL = { ADMIN: "Admin", DOCTOR: "Doctor", PATIENT: "Patient" };

export default function AppShell({ user, children }) {
  return (
    <div className="min-h-screen lg:flex">
      <aside className="no-print border-b border-slate-200 bg-white lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:shrink-0 lg:border-r lg:border-b-0">
        <div className="flex h-full flex-col gap-4 p-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700 text-lg font-bold text-white">
              +
            </span>
            <span className="font-semibold text-slate-900">{CLINIC.name}</span>
          </Link>
          <NavLinks links={NAV[user.role]} />
          <div className="mt-auto hidden border-t border-slate-200 pt-4 lg:block">
            <p className="truncate text-sm font-medium text-slate-900">
              {user.role === "DOCTOR" ? `Dr. ${user.name}` : user.name}
            </p>
            <p className="text-xs text-slate-500">{ROLE_LABEL[user.role]}</p>
            <form action={logoutAction} className="mt-3">
              <button className="btn-secondary btn-sm w-full">Log out</button>
            </form>
          </div>
          <form action={logoutAction} className="lg:hidden">
            <button className="btn-secondary btn-sm">Log out ({user.name})</button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
