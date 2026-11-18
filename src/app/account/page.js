import AppShell from "@/components/AppShell";
import { PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/session";
import PasswordForm from "./PasswordForm";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const user = await requireRole();

  return (
    <AppShell user={user}>
      <PageHeader title="Account" subtitle={user.email} />
      <div className="card max-w-md">
        <h2 className="mb-4 font-semibold">Change password</h2>
        <PasswordForm />
      </div>
    </AppShell>
  );
}
