import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { prisma } from "./prisma";

// Loads the logged-in user once per request. The layout and the page both call
// requireRole(); React's cache() makes them share one database query instead
// of each making its own round trip to the database.
const loadCurrentUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({
    where: { id: Number(session.user.id) },
    include: { doctor: true, patient: true },
  });
});

// Server-side authorization check, used by every page and server action on
// top of the middleware. It re-reads the user from the database, so a
// deactivated account is blocked immediately even if its session cookie is
// still valid.
export async function requireRole(...roles) {
  const user = await loadCurrentUser();
  if (!user) redirect("/login");
  if (!user.isActive) redirect("/login?error=inactive");
  if (roles.length && !roles.includes(user.role)) redirect("/dashboard");

  return user;
}
