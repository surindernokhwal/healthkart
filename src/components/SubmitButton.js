"use client";

import { useFormStatus } from "react-dom";

// `pending` can be passed explicitly for forms submitted with
// submitWithoutReset (see useClientValidation.js)
export default function SubmitButton({
  children,
  pending,
  pendingText = "Please wait...",
  className = "btn-primary",
  ...props
}) {
  const status = useFormStatus();
  const busy = pending ?? status.pending;
  return (
    <button type="submit" disabled={busy} className={className} {...props}>
      {busy ? pendingText : children}
    </button>
  );
}
