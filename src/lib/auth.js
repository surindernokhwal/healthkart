import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import { prisma } from "./prisma";
import { loginSchema } from "./validation";
import { logActivity } from "./activity";

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.isActive) return null;

        // Brute-force protection: lock the account after repeated failures
        if (user.lockedUntil && user.lockedUntil > new Date()) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) {
          const failed = user.failedLogins + 1;
          const lock = failed >= MAX_ATTEMPTS;
          await prisma.user.update({
            where: { id: user.id },
            data: lock
              ? { failedLogins: 0, lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60_000) }
              : { failedLogins: failed },
          });
          if (lock) await logActivity(user.id, "ACCOUNT_LOCKED", `${MAX_ATTEMPTS} failed logins`);
          return null;
        }

        // Reset the failure counter only when needed, and write it together
        // with the audit log entry (one round trip instead of two)
        const needsReset = user.failedLogins > 0 || user.lockedUntil !== null;
        await Promise.all([
          needsReset &&
            prisma.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null } }),
          logActivity(user.id, "LOGIN"),
        ]);

        return { id: String(user.id), name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
});
