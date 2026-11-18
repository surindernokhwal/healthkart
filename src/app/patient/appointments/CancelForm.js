"use client";

import { useActionState } from "react";
import { cancelAppointment } from "@/actions/patient";
import ConfirmButton from "@/components/ConfirmButton";

export default function CancelForm({ id, code }) {
  const [state, action] = useActionState(cancelAppointment, {});
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <ConfirmButton message={`Cancel appointment ${code}?`}>Cancel</ConfirmButton>
      {state.error && <p className="error-text">{state.error}</p>}
    </form>
  );
}
