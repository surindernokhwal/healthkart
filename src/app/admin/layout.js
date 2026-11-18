import AppShell from "@/components/AppShell";
import { requireRole } from "@/lib/session";

export default async function AdminLayout({ children }) {
  const user = await requireRole("ADMIN");
  return <AppShell user={user}>{children}</AppShell>;
}
