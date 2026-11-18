import nodemailer from "nodemailer";
import { formatDate, formatTime } from "./format";

const configured = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

const transporter = configured
  ? nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

const CLINIC = process.env.CLINIC_NAME || "City Care Clinic";

const escape = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Sends an email. Failures are logged and never stop the main operation.
async function send(to, subject, html) {
  if (!configured) {
    console.log(`[email skipped: SMTP not configured] To: ${to} | ${subject}`);
    return;
  }
  try {
    await transporter.sendMail({ from: `"${CLINIC}" <${process.env.SMTP_USER}>`, to, subject, html });
  } catch (err) {
    console.error("Email failed:", err.message);
  }
}

function details(appt) {
  return `
    <table cellpadding="6" style="border-collapse:collapse;font-family:Arial,sans-serif">
      <tr><td><b>Booking ID</b></td><td>${appt.bookingCode}</td></tr>
      <tr><td><b>Doctor</b></td><td>Dr. ${escape(appt.doctor.user.name)} (${escape(appt.doctor.department.name)})</td></tr>
      <tr><td><b>Date</b></td><td>${formatDate(appt.date)}</td></tr>
      <tr><td><b>Time</b></td><td>${formatTime(appt.timeSlot)}</td></tr>
    </table>`;
}

export function sendBookingEmail(appt) {
  return send(
    appt.patient.user.email,
    `Appointment confirmed - ${appt.bookingCode}`,
    `<p>Dear ${escape(appt.patient.user.name)},</p>
     <p>Your appointment at ${escape(CLINIC)} is confirmed.</p>${details(appt)}
     <p>You can cancel or reschedule up to 2 hours before the slot time.</p>`
  );
}

export function sendCancellationEmail(appt) {
  return send(
    appt.patient.user.email,
    `Appointment cancelled - ${appt.bookingCode}`,
    `<p>Dear ${escape(appt.patient.user.name)},</p>
     <p>Your appointment has been cancelled.</p>${details(appt)}`
  );
}

export function sendRescheduleEmail(oldAppt, newAppt) {
  return send(
    newAppt.patient.user.email,
    `Appointment rescheduled - ${newAppt.bookingCode}`,
    `<p>Dear ${escape(newAppt.patient.user.name)},</p>
     <p>Your appointment <b>${oldAppt.bookingCode}</b> (${formatDate(oldAppt.date)}, ${formatTime(
      oldAppt.timeSlot
    )}) has been rescheduled. New details:</p>${details(newAppt)}`
  );
}
