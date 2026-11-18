// Database backup (synopsis section 10, security level 6).
// Run with:  npm run db:backup
//
// - If pg_dump (PostgreSQL client tools) is installed, writes a full SQL dump:
//   backups/clinic-<date-time>.sql   (restore with: psql <DIRECT_URL> -f <file>)
// - Otherwise exports every table to JSON with Prisma:
//   backups/clinic-<date-time>.json
//
// Backups contain patient data, so the backups/ folder is git-ignored.

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("DIRECT_URL is not set. Run this with: npm run db:backup");
  process.exit(1);
}

const dir = path.join(__dirname, "..", "backups");
fs.mkdirSync(dir, { recursive: true });
const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");

function hasPgDump() {
  const r = spawnSync("pg_dump", ["--version"], { encoding: "utf8" });
  return r.status === 0;
}

function pgDumpBackup() {
  // Keep the password out of the command line: pass it in PGPASSWORD instead
  const u = new URL(url);
  const password = decodeURIComponent(u.password);
  u.password = "";
  const file = path.join(dir, `clinic-${stamp}.sql`);
  const r = spawnSync("pg_dump", ["--no-owner", "--no-privileges", "--file", file, "--dbname", u.toString()], {
    env: { ...process.env, PGPASSWORD: password },
    stdio: "inherit",
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
  return file;
}

async function jsonBackup() {
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  // Every model in prisma/schema.prisma, in an order that respects foreign keys
  const models = [
    "user",
    "patient",
    "department",
    "doctor",
    "doctorSchedule",
    "doctorLeave",
    "appointment",
    "medicine",
    "prescription",
    "prescriptionItem",
    "bill",
    "activityLog",
  ];
  const data = { createdAt: new Date().toISOString(), tables: {} };
  try {
    for (const m of models) {
      data.tables[m] = await prisma[m].findMany({ orderBy: { id: "asc" } });
      console.log(`${m.padEnd(18)} ${data.tables[m].length} rows`);
    }
  } finally {
    await prisma.$disconnect();
  }
  const file = path.join(dir, `clinic-${stamp}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  return file;
}

(async () => {
  let file;
  if (hasPgDump()) {
    console.log("Backing up with pg_dump...");
    file = pgDumpBackup();
  } else {
    console.log("pg_dump not found (install the PostgreSQL client tools for SQL dumps). Exporting tables to JSON...");
    file = await jsonBackup();
  }
  console.log(`Backup saved: ${path.relative(process.cwd(), file)}`);
})().catch((err) => {
  console.error("Backup failed:", err.message);
  process.exit(1);
});
