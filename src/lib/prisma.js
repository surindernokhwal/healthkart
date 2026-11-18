import { PrismaClient } from "@prisma/client";

// Reuse a single PrismaClient in development (hot reload creates new modules).
const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
