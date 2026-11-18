import AppShell from "@/components/AppShell";
import { requireRole } from "@/lib/session";

export default async function PatientLayout({ children }) {
  const user = await requireRole("PATIENT");
  return <AppShell user={user}>{children}</AppShell>;
}
