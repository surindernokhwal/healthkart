# Clinic Appointment and Patient Management System

BCA project: a web application built with **Next.js 15 (App Router)**, **Prisma ORM** and **PostgreSQL (Neon)**, with **Auth.js**, **Tailwind CSS**, **Zod**, **bcrypt**, **Nodemailer** and **Recharts**.

There are three roles, each with its own dashboard: **Admin**, **Doctor** and **Patient**.

## Running the project

```bash
npm install               # also runs "prisma generate"
cp .env.example .env      # then fill in DATABASE_URL, DIRECT_URL, AUTH_SECRET
npm run db:migrate        # creates all tables in the database
npm run db:seed           # admin, departments, doctors, medicines, demo patient
npm run dev               # http://localhost:3000
```

### Demo logins (created by the seed)

| Role    | Email                    | Password    |
|---------|--------------------------|-------------|
| Admin   | admin@clinic.com         | Admin@123   |
| Doctor  | anil.sharma@clinic.com   | Doctor@123  |
| Patient | patient@clinic.com       | Patient@123 |

The other seeded doctors (priya.rawat, rohit.negi, meena.joshi @clinic.com) also use `Doctor@123`.

### Useful commands

| Command              | What it does                                         |
|----------------------|------------------------------------------------------|
| `npm run dev`        | Development server with hot reload (Turbopack); pages compile on first visit, so it is slower |
| `npm run fast`       | Build and run the fast production version (use this for demos) |
| `npm run build`      | Production build                                     |
| `npm run db:migrate` | Apply schema changes and create a migration (dev)    |
| `npm run db:deploy`  | Apply existing migrations (production)               |
| `npm run db:seed`    | Insert the demo data again (safe to repeat)          |
| `npm run db:studio`  | Prisma Studio: browse and edit tables in the browser |
| `npm run db:backup`  | Back up the database into `backups/` (SQL with `pg_dump` if installed, otherwise JSON) |
| `npm run db:demo`    | Add demo history: past visits, prescriptions, paid/pending bills, cancellations (safe to repeat) |
| `npm test`           | Run the automated unit tests (`tests/unit.test.mjs`)  |

### Windows .exe launcher

The university asks for a `.exe` of the running project. Because this is a web application, `launcher/` builds a small Windows program that opens the hosted app in its own window (Edge or Chrome app mode, otherwise the default browser):

```powershell
powershell -ExecutionPolicy Bypass -File launcher\build-exe.ps1 -Url https://your-app.vercel.app
```

The result is `launcher\dist\ClinicAppointmentSystem.exe` (about 11 KB). It uses the C# compiler included in Windows, so nothing has to be installed.

### Email notifications (optional)

Set `SMTP_USER` (your Gmail address) and `SMTP_PASS` (a Gmail **App password**) in `.env`. When they are empty, emails are skipped and logged to the terminal, and the app works normally.

### Deploying to Vercel (free)

1. Push the project to GitHub (`.env` is git-ignored).
2. On vercel.com, import the repository.
3. Add the same environment variables as in `.env`.
4. Run `npm run db:deploy` once against the Neon database (or add it to the build command).

## Project structure

```
prisma/
  schema.prisma        # database models (Table 8)
  seed.js              # default admin, departments, doctors, medicines
src/
  middleware.js        # role-based route protection (FR-22)
  app/
    (site)/            # public website: home, departments, doctors (with profiles), about, contact + FAQ
    (auth)/            # login, register
    admin/             # dashboard, departments, doctors, appointments, patients, bills, reports, activity log
    doctor/            # today's list, appointments, consultation + prescription, schedule & leave
    patient/           # home, booking, my appointments, prescriptions, bills, profile
    print/             # printable prescription and invoice (Save as PDF)
    account/           # change password (all roles)
    api/auth/          # Auth.js route
  actions/             # server actions: auth, admin, doctor, patient
  components/          # shared UI, charts, patient history
    site/              # website header, footer, doctor card, icons
  lib/                 # prisma, auth, session, slots, reports, mailer, validation, time, site (website data)
```

## Where each requirement is implemented

| Requirement | Implementation |
|---|---|
| FR-01 Admin dashboard | `app/admin/page.js` |
| FR-02 Departments | `app/admin/departments`, `actions/admin.js` |
| FR-03 Add doctors + login accounts | `app/admin/doctors`, `createDoctor()` |
| FR-04 Search/filter appointments, patients, bills | `app/admin/appointments`, `app/admin/patients`, `app/admin/bills` |
| FR-05 Mark bills paid, invoices | `markBillPaid()`, `app/print/invoice/[id]` |
| FR-06 Reports + CSV export | `lib/reports.js`, `app/admin/reports`, `app/admin/reports/export` |
| FR-07 Weekly availability | `app/doctor/schedule`, `saveSchedule()` |
| FR-08 Leave dates | `addLeave()`; leave days show no slots |
| FR-09 Daily / upcoming list | `app/doctor/page.js`, `app/doctor/appointments` |
| FR-10 Patient history | `components/PatientHistory.js` |
| FR-11 Digital prescription | `app/doctor/appointments/[id]`, `savePrescription()` |
| FR-12 Patient registration | `app/(auth)/register`, `registerAction()` |
| FR-13 Search doctors, free slots | public `app/(site)/doctors` and `app/(site)/departments` (timings, fees, profiles), then `app/patient/book`, `getFreeSlots()` in `lib/slots.js` |
| FR-14 Booking ID + confirmation email | `bookAppointment()`, `lib/mailer.js` |
| FR-15 Cancel/reschedule (2-hour rule) | `cancelAppointment()`, `bookAppointment()` with `rescheduleId`, `canModify()` |
| FR-16 Prescription / invoice PDF | `app/print/*` (browser "Save as PDF") |
| FR-17 History + profile | `app/patient/appointments`, `app/patient/profile` |
| FR-18 Automatic slots, hide booked/past | `generateSlots()`, `getFreeSlots()` |
| FR-19 Reject simultaneous booking | unique `active_slot` column + `P2002` handling |
| FR-20 Automatic bill | created in the same transaction as the prescription |
| FR-21 Emails | `lib/mailer.js` (booking, cancellation, reschedule) |
| FR-22 Role restriction | `middleware.js` + `requireRole()` in every page and action |

## Implementation notes (differences from the synopsis)

These are small practical changes; describe them in the project report if needed.

1. **Double-booking key.** A plain unique key on `(doctor_id, date, time_slot)` would stop a *cancelled* slot from ever being booked again. Instead, `appointments.active_slot` holds `"doctorId|date|time"` while the appointment is active and is set to `NULL` when it is cancelled. PostgreSQL allows many NULLs in a unique column, so the database still rejects two active bookings for the same slot.
2. **Times stored as `"HH:MM"` text** (`VARCHAR(5)`) instead of `TIME`. This avoids timezone conversion problems. All dates and times use Indian Standard Time, even on servers running in UTC.
3. **bcryptjs** (pure-JavaScript bcrypt) is used instead of the native `bcrypt` package. It is the same algorithm and hash format, with no C++ build tools needed on Windows.
4. **Extra columns and tables for the security section:** `users.failed_logins` and `users.locked_until` (account locked for 15 minutes after 5 wrong passwords), `departments.is_active`, `bills.paid_at`, and an `activity_logs` table (audit log, visible to the admin).
5. **Clinic-side cancellation.** The admin can cancel a confirmed appointment (for example, when a doctor is unavailable), and the patient is emailed. A doctor cannot mark leave on a date that still has confirmed appointments.
6. **Public website.** Besides the three dashboards, the project has a public website: Home, Departments (one page each, with services), Doctors (profile page with weekly timings, fee and leave days), About Us and Contact with FAQ. "Book" on a doctor's profile opens the booking form for that doctor, after login or registration if needed.
7. **Performance.** The database (Neon, Singapore) is a network round trip away, so:
   - Prisma's `relationJoins` setting loads related tables with SQL JOINs in one query instead of one query per relation.
   - Independent queries run together with `Promise.all`.
   - The logged-in user is loaded once per request (React `cache()`), even though the layout and the page both check it.
   - Public website pages are pre-built and refreshed at most once a minute (Incremental Static Regeneration, `revalidate = 60`).
   - Neon's free tier pauses the database after 5 idle minutes, so the first request after a pause takes about 1 second longer.
8. **Validation on both sides.** Every form is checked in the browser with the same Zod schema the server action uses (`components/useClientValidation.js`, `lib/validation.js`), so mistakes appear instantly. The server action validates again, because browser checks can be bypassed.
9. **Backups.** `npm run db:backup` uses `pg_dump` when the PostgreSQL client tools are installed; otherwise it exports every table to JSON with Prisma. Neon also keeps its own restore history.
