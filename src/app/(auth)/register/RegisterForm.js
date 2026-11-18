"use client";

import { useActionState } from "react";
import { registerAction } from "@/actions/auth";
import SubmitButton from "@/components/SubmitButton";
import { Alert, Field } from "@/components/ui";
import { useClientValidation } from "@/components/useClientValidation";
import { GENDERS, registerSchema, zodCheck } from "@/lib/validation";

const check = zodCheck(registerSchema);

export default function RegisterForm({ next }) {
  const [state, action] = useActionState(registerAction, {});
  const { clientErrors, onSubmit } = useClientValidation(check);
  const e = clientErrors ?? state.errors ?? {};
  const v = state.values ?? {};

  return (
    <form action={action} onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
      {next && <input type="hidden" name="next" value={next} />}
      <div className="sm:col-span-2">
        <Alert>{state.error}</Alert>
      </div>
      <Field label="Full name" error={e.name} className="sm:col-span-2">
        <input name="name" required maxLength={100} className="input" defaultValue={v.name} />
      </Field>
      <Field label="Email" error={e.email}>
        <input name="email" type="email" required className="input" defaultValue={v.email} autoComplete="email" />
      </Field>
      <Field label="Mobile number" error={e.phone}>
        <input
          name="phone"
          inputMode="numeric"
          required
          maxLength={10}
          placeholder="10-digit number"
          className="input"
          defaultValue={v.phone}
        />
      </Field>
      <Field label="Gender" error={e.gender}>
        <select name="gender" required className="input" defaultValue={v.gender ?? ""}>
          <option value="" disabled>
            Select
          </option>
          {GENDERS.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
      </Field>
      <Field label="Date of birth" error={e.dob}>
        <input name="dob" type="date" required className="input" defaultValue={v.dob} />
      </Field>
      <Field label="Address (optional)" error={e.address} className="sm:col-span-2">
        <textarea name="address" rows={2} maxLength={500} className="input" defaultValue={v.address} />
      </Field>
      <Field label="Password" error={e.password}>
        <input name="password" type="password" required autoComplete="new-password" className="input" />
      </Field>
      <Field label="Confirm password" error={e.confirmPassword}>
        <input name="confirmPassword" type="password" required autoComplete="new-password" className="input" />
      </Field>
      <p className="text-xs text-slate-500 sm:col-span-2">
        Password: at least 8 characters with an uppercase letter, a lowercase letter and a digit.
      </p>
      <SubmitButton className="btn-primary sm:col-span-2" pendingText="Creating account...">
        Create account
      </SubmitButton>
    </form>
  );
}
