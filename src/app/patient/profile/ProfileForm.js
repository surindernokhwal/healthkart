"use client";

import { useActionState, useState } from "react";
import { updateProfile } from "@/actions/patient";
import SubmitButton from "@/components/SubmitButton";
import { Alert, Field } from "@/components/ui";
import { useClientValidation } from "@/components/useClientValidation";
import { GENDERS, profileSchema, zodCheck } from "@/lib/validation";

const check = zodCheck(profileSchema);

export default function ProfileForm({ initial }) {
  const [state, action, pending] = useActionState(updateProfile, {});
  const { clientErrors, submitWithoutReset } = useClientValidation(check);
  const [v, setV] = useState(initial);
  const e = clientErrors ?? state.errors ?? {};
  const bind = (name) => ({ name, value: v[name], onChange: (ev) => setV({ ...v, [name]: ev.target.value }) });

  return (
    <form onSubmit={submitWithoutReset(action)} noValidate className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Alert type="success">{state.success}</Alert>
      </div>
      <Field label="Full name" error={e.name} className="sm:col-span-2">
        <input {...bind("name")} required maxLength={100} className="input" />
      </Field>
      <Field label="Mobile number" error={e.phone}>
        <input {...bind("phone")} required maxLength={10} inputMode="numeric" className="input" />
      </Field>
      <Field label="Gender" error={e.gender}>
        <select {...bind("gender")} required className="input">
          {GENDERS.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
      </Field>
      <Field label="Date of birth" error={e.dob}>
        <input {...bind("dob")} type="date" required className="input" />
      </Field>
      <Field label="Address" error={e.address} className="sm:col-span-2">
        <textarea {...bind("address")} rows={2} maxLength={500} className="input" />
      </Field>
      <div className="sm:col-span-2">
        <SubmitButton pending={pending}>Save profile</SubmitButton>
      </div>
    </form>
  );
}
