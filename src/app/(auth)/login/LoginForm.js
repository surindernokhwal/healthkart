"use client";

import { useActionState } from "react";
import { loginAction } from "@/actions/auth";
import SubmitButton from "@/components/SubmitButton";
import { Alert, Field } from "@/components/ui";
import { useClientValidation } from "@/components/useClientValidation";
import { loginSchema, zodCheck } from "@/lib/validation";

const check = zodCheck(loginSchema);

export default function LoginForm({ next }) {
  const [state, action] = useActionState(loginAction, {});
  const { clientErrors, onSubmit } = useClientValidation(check);
  const e = clientErrors ?? state.errors ?? {};

  return (
    <form action={action} onSubmit={onSubmit} noValidate className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      <Alert>{state.error}</Alert>
      <Field label="Email" error={e.email}>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="input"
          defaultValue={state.values?.email}
        />
      </Field>
      <Field label="Password" error={e.password}>
        <input name="password" type="password" required autoComplete="current-password" className="input" />
      </Field>
      <SubmitButton className="btn-primary w-full" pendingText="Logging in...">
        Log in
      </SubmitButton>
    </form>
  );
}
