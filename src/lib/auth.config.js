// Edge-safe Auth.js configuration (no database or bcrypt imports), shared by
// middleware.js and lib/auth.js.

const ROLE_HOME = { ADMIN: "/admin", DOCTOR: "/doctor", PATIENT: "/patient" };

export function homeFor(role) {
  return ROLE_HOME[role] ?? "/login";
}

export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 }, // sessions expire after 8 hours
  providers: [], // the Credentials provider is added in lib/auth.js
  callbacks: {
    // Role-based access control for every protected route (FR-22)
    authorized({ auth, request: { nextUrl } }) {
      const role = auth?.user?.role;
      const path = nextUrl.pathname;
      if (!role) return false; // not logged in -> redirect to /login

      for (const [r, prefix] of Object.entries(ROLE_HOME)) {
        if ((path === prefix || path.startsWith(prefix + "/")) && role !== r) {
          return Response.redirect(new URL(homeFor(role), nextUrl));
        }
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
};
