import { CLINIC } from "@/lib/clinic";
import { getPublicDepartments } from "@/lib/site";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";

// Public website pages are pre-built and refreshed at most once a minute, so
// they open instantly instead of querying the database on every visit.
export const revalidate = 60;

export default async function SiteLayout({ children }) {
  const departments = await getPublicDepartments();
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader clinicName={CLINIC.name} phone={CLINIC.phone} />
      <main className="flex-1">{children}</main>
      <SiteFooter departments={departments} />
    </div>
  );
}
