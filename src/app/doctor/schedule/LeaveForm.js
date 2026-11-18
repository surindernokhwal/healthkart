"use client";

import { useActionState, useEffect, useState } from "react";
import { addLeave } from "@/actions/doctor";
import SubmitButton from "@/components/SubmitButton";
import { Alert, Field } from "@/components/ui";
import { useClientValidation } from "@/components/useClientValidation";
import { leaveSchema, zodCheck } from "@/lib/validation";

const check = zodCheck(leaveSchema);

export default function LeaveForm() {
  const [state, action, pending] = useActionState(addLeave, {});
  const { clientErrors, submitWithoutReset } = useClientValidation(check);
  const [leaveDate, setLeaveDate] = useState("");
  const [reason, setReason] = useState("");
  const e = clientErrors ?? state.errors ?? {};

  useEffect(() => {
    if (state.reset) {
      setLeaveDate("");
      setReason("");
    }
  }, [state]);

  return (
    <form onSubmit={submitWithoutReset(action)} noValidate className="space-y-3">
      <Alert type="success">{state.success}</Alert>
      <Field label="Date" error={e.leaveDate}>
        <input
          type="date"
          name="leaveDate"
          required
          className="input"
          value={leaveDate}
          onChange={(ev) => setLeaveDate(ev.target.value)}
        />
      </Field>
      <Field label="Reason (optional)" error={e.reason}>
        <input
          name="reason"
          maxLength={150}
          className="input"
          value={reason}
          onChange={(ev) => setReason(ev.target.value)}
        />
      </Field>
      <SubmitButton pending={pending} className="btn-secondary">
        Mark as leave
      </SubmitButton>
    </form>
  );
}
