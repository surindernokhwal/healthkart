"use client";

import { useActionState } from "react";
import { markBillPaid } from "@/actions/admin";
import SubmitButton from "@/components/SubmitButton";
import { useClientValidation } from "@/components/useClientValidation";
import { markPaidSchema, zodCheck } from "@/lib/validation";

const check = zodCheck(markPaidSchema);

export default function MarkPaidForm({ billId }) {
  const [state, action] = useActionState(markBillPaid, {});
  const { clientErrors, onSubmit } = useClientValidation(check);
  const error = clientErrors ? Object.values(clientErrors)[0] : state.error;

  return (
    <form action={action} onSubmit={onSubmit} noValidate className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="billId" value={billId} />
      <select name="mode" required defaultValue="" className="input w-auto py-1.5 text-xs" aria-label="Payment mode">
        <option value="" disabled>
          Mode
        </option>
        <option value="CASH">Cash</option>
        <option value="UPI">UPI</option>
      </select>
      <SubmitButton className="btn-primary btn-sm" pendingText="Saving...">
        Mark paid
      </SubmitButton>
      {error && <p className="error-text w-full">{error}</p>}
    </form>
  );
}
