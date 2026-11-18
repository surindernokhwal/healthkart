import AppShell from "@/components/AppShell";
import { requireRole } from "@/lib/session";

export default async function DoctorLayout({ children }) {
  const user = await requireRole("DOCTOR");
  return <AppShell user={user}>{children}</AppShell>;
}
