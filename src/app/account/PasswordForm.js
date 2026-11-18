"use client";

import { useActionState, useEffect, useRef } from "react";
import { changePassword } from "@/actions/patient";
import SubmitButton from "@/components/SubmitButton";
import { Alert, Field } from "@/components/ui";
import { useClientValidation } from "@/components/useClientValidation";
import { changePasswordSchema, zodCheck } from "@/lib/validation";

const check = zodCheck(changePasswordSchema);

export default function PasswordForm() {
  const [state, action] = useActionState(changePassword, {});
  const { clientErrors, onSubmit } = useClientValidation(check);
  const formRef = useRef(null);
  const e = clientErrors ?? state.errors ?? {};

  useEffect(() => {
    if (state.reset) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} onSubmit={onSubmit} noValidate className="space-y-4">
      <Alert type="success">{state.success}</Alert>
      <Field label="Current password" error={e.currentPassword}>
        <input name="currentPassword" type="password" required className="input" autoComplete="current-password" />
      </Field>
      <Field label="New password" error={e.newPassword}>
        <input name="newPassword" type="password" required className="input" autoComplete="new-password" />
      </Field>
      <Field label="Confirm new password" error={e.confirmPassword}>
        <input name="confirmPassword" type="password" required className="input" autoComplete="new-password" />
      </Field>
      <SubmitButton>Change password</SubmitButton>
    </form>
  );
}
