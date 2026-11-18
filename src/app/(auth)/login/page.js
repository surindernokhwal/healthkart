import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { safeNextPath } from "@/lib/redirect";
import LoginForm from "./LoginForm";

export const metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }) {
  const { error, next: nextParam, callbackUrl } = await searchParams;
  // Where to go after logging in: ?next= from the website's "Book" buttons, or
  // ?callbackUrl= added by the middleware when a protected page was opened.
  const next = safeNextPath(nextParam) ?? safeNextPath(callbackUrl);

  const session = await auth();
  if (session?.user) redirect(next ?? "/dashboard");

  return (
    <div className="card w-full max-w-sm p-6">
      <h1 className="text-xl font-semibold">Log in</h1>
      <p className="mt-1 mb-5 text-sm text-slate-500">For patients, doctors and clinic staff</p>
      {error === "inactive" && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          Your account is inactive. Please contact the clinic.
        </p>
      )}
      {next?.startsWith("/patient/book") && (
        <p className="mb-4 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-900">
          Log in to book your appointment. New here? Create a free account first.
        </p>
      )}
      <LoginForm next={next} />
      <p className="mt-5 text-center text-sm text-slate-500">
        New patient?{" "}
        <Link href={next ? `/register?next=${encodeURIComponent(next)}` : "/register"} className="link">
          Create an account
        </Link>
      </p>
    </div>
  );
}
