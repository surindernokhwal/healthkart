-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'DOCTOR', 'PATIENT');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('CONFIRMED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PayStatus" AS ENUM ('PENDING', 'PAID');

-- CreateEnum
CREATE TYPE "PayMode" AS ENUM ('CASH', 'UPI');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(120) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "Role" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "failed_logins" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "gender" VARCHAR(10) NOT NULL,
    "dob" DATE NOT NULL,
    "phone" VARCHAR(15) NOT NULL,
    "address" TEXT,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctors" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "department_id" INTEGER NOT NULL,
    "qualification" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(15) NOT NULL,
    "fee" DECIMAL(8,2) NOT NULL,

    CONSTRAINT "doctors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_schedules" (
    "id" SERIAL NOT NULL,
    "doctor_id" INTEGER NOT NULL,
    "weekday" INTEGER NOT NULL,
    "start_time" VARCHAR(5) NOT NULL,
    "end_time" VARCHAR(5) NOT NULL,
    "slot_minutes" INTEGER NOT NULL,

    CONSTRAINT "doctor_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_leaves" (
    "id" SERIAL NOT NULL,
    "doctor_id" INTEGER NOT NULL,
    "leave_date" DATE NOT NULL,
    "reason" VARCHAR(150),

    CONSTRAINT "doctor_leaves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" SERIAL NOT NULL,
    "booking_code" VARCHAR(12) NOT NULL,
    "patient_id" INTEGER NOT NULL,
    "doctor_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "time_slot" VARCHAR(5) NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'CONFIRMED',
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active_slot" VARCHAR(40),

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescriptions" (
    "id" SERIAL NOT NULL,
    "appointment_id" INTEGER NOT NULL,
    "diagnosis" TEXT NOT NULL,
    "advice" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicines" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" VARCHAR(30) NOT NULL,

    CONSTRAINT "medicines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescription_items" (
    "id" SERIAL NOT NULL,
    "prescription_id" INTEGER NOT NULL,
    "medicine_id" INTEGER NOT NULL,
    "dosage" VARCHAR(50) NOT NULL,
    "duration_days" INTEGER NOT NULL,

    CONSTRAINT "prescription_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bills" (
    "id" SERIAL NOT NULL,
    "appointment_id" INTEGER NOT NULL,
    "amount" DECIMAL(8,2) NOT NULL,
    "status" "PayStatus" NOT NULL DEFAULT 'PENDING',
    "mode" "PayMode",
    "bill_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_at" TIMESTAMP(3),

    CONSTRAINT "bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "action" VARCHAR(50) NOT NULL,
    "details" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "patients_user_id_key" ON "patients"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "doctors_user_id_key" ON "doctors"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_schedules_doctor_id_weekday_key" ON "doctor_schedules"("doctor_id", "weekday");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_leaves_doctor_id_leave_date_key" ON "doctor_leaves"("doctor_id", "leave_date");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_booking_code_key" ON "appointments"("booking_code");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_active_slot_key" ON "appointments"("active_slot");

-- CreateIndex
CREATE INDEX "appointments_doctor_id_date_idx" ON "appointments"("doctor_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "prescriptions_appointment_id_key" ON "prescriptions"("appointment_id");

-- CreateIndex
CREATE UNIQUE INDEX "medicines_name_key" ON "medicines"("name");

-- CreateIndex
CREATE UNIQUE INDEX "bills_appointment_id_key" ON "bills"("appointment_id");

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_schedules" ADD CONSTRAINT "doctor_schedules_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_leaves" ADD CONSTRAINT "doctor_leaves_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "prescriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "medicines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
