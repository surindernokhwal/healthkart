"use client";

import { useFormStatus } from "react-dom";

// Submit button that asks for confirmation first
export default function ConfirmButton({ message, children, className = "btn-danger btn-sm" }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {pending ? "Please wait..." : children}
    </button>
  );
}
