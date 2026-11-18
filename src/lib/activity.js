import { prisma } from "./prisma";

// Audit log of important actions. A logging failure never breaks the main
// operation.
export async function logActivity(userId, action, details) {
  try {
    await prisma.activityLog.create({
      data: { userId: userId ? Number(userId) : null, action, details },
    });
  } catch (err) {
    console.error("Activity log failed:", err.message);
  }
}
