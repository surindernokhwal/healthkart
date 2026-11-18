// Clinic details shown on the website, invoices and prescriptions (edit in .env)
export const CLINIC = {
  name: process.env.CLINIC_NAME || "City Care Clinic",
  address: process.env.CLINIC_ADDRESS || "Rajpur Road, Dehradun, Uttarakhand 248001",
  phone: process.env.CLINIC_PHONE || "+91 135 000 0000",
  email: process.env.CLINIC_EMAIL || "", // shown only when set
  hours: process.env.CLINIC_HOURS || "Mon–Sat: 9:30 AM – 7:00 PM · Sunday closed",
};
