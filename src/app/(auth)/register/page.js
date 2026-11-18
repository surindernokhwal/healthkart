import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { safeNextPath } from "@/lib/redirect";
import RegisterForm from "./RegisterForm";

export const metadata = { title: "Register" };

export default async function RegisterPage({ searchParams }) {
  const { next: nextParam } = await searchParams;
  const next = safeNextPath(nextParam);

  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="card w-full max-w-lg p-6">
      <h1 className="text-xl font-semibold">Create a patient account</h1>
      <p className="mt-1 mb-5 text-sm text-slate-500">Register once to book appointments online.</p>
      <RegisterForm next={next} />
      <p className="mt-5 text-center text-sm text-slate-500">
        Already registered?{" "}
        <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="link">
          Log in
        </Link>
      </p>
    </div>
  );
}
