"use client";

export default function PrintButton({ label = "Print / Save as PDF" }) {
  return (
    <button type="button" onClick={() => window.print()} className="btn-primary no-print">
      {label}
    </button>
  );
}
