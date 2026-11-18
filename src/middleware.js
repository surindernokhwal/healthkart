import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Role-based route protection (FR-22). Every server action checks the role
// again with requireRole().
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: [
    "/admin/:path*",
    "/doctor/:path*",
    "/patient/:path*",
    "/print/:path*",
    "/account/:path*",
    "/dashboard",
  ],
};
