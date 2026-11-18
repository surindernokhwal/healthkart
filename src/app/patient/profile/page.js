import { requireRole } from "@/lib/session";
import { toDateStr } from "@/lib/time";
import { PageHeader } from "@/components/ui";
import ProfileForm from "./ProfileForm";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireRole("PATIENT");
  const values = {
    name: user.name,
    phone: user.patient.phone,
    gender: user.patient.gender,
    dob: toDateStr(user.patient.dob),
    address: user.patient.address ?? "",
  };

  return (
    <>
      <PageHeader title="Profile" subtitle={user.email} />
      <div className="card max-w-2xl">
        <ProfileForm initial={values} />
      </div>
    </>
  );
}
