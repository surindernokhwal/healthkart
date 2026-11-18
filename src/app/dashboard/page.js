import { redirect } from "next/navigation";
import { requireRole } from "@/lib/session";
import { homeFor } from "@/lib/auth.config";

// Sends each user to their own dashboard after login (M1 step 5)
export default async function DashboardRedirect() {
  const user = await requireRole();
  redirect(homeFor(user.role));
}
