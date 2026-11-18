"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { signIn, signOut } from "@/lib/auth";
import { fieldErrors, loginSchema, registerSchema } from "@/lib/validation";
import { dateOnly } from "@/lib/time";
import { logActivity } from "@/lib/activity";
import { safeNextPath } from "@/lib/redirect";

// M1 – login for all roles
export async function loginAction(prevState, formData) {
  const data = Object.fromEntries(formData);
  const parsed = loginSchema.safeParse(data);
  if (!parsed.success) return { errors: fieldErrors(parsed), values: { email: data.email } };

  try {
    // On success this throws a redirect: back to the page the user came from
    // (e.g. "Book" on a doctor's profile), or to /dashboard, which sends the
    // user to the correct role dashboard.
    const redirectTo = safeNextPath(data.next) ?? "/dashboard";
    await signIn("credentials", { ...parsed.data, redirectTo });
  } catch (err) {
    if (err instanceof AuthError) {
      return {
        error: "Invalid credentials, or the account is inactive or temporarily locked.",
        values: { email: data.email },
      };
    }
    throw err;
  }
}

// M1 – patient self-registration (FR-12)
export async function registerAction(prevState, formData) {
  const data = Object.fromEntries(formData);
  const { password, confirmPassword, ...values } = data;
  const parsed = registerSchema.safeParse(data);
  if (!parsed.success) return { errors: fieldErrors(parsed), values };

  const { name, email, phone, gender, dob, address } = parsed.data;

  if (await prisma.user.findUnique({ where: { email } })) {
    return { errors: { email: "An account with this email already exists" }, values };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "PATIENT",
        patient: { create: { phone, gender, dob: dateOnly(dob), address: address || null } },
      },
    });
    await logActivity(user.id, "REGISTER");
  } catch (err) {
    if (err.code === "P2002") return { errors: { email: "An account with this email already exists" }, values };
    throw err;
  }

  // A new patient who came from "Book" on the website goes straight back to booking
  const next = safeNextPath(data.next);
  await signIn("credentials", {
    email,
    password: parsed.data.password,
    redirectTo: next?.startsWith("/patient/") ? next : "/patient",
  });
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
