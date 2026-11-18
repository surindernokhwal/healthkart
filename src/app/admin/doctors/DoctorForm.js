"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createDoctor, updateDoctor } from "@/actions/admin";
import SubmitButton from "@/components/SubmitButton";
import { Alert, Field } from "@/components/ui";
import { useClientValidation } from "@/components/useClientValidation";
import { doctorCreateSchema, doctorUpdateSchema, zodCheck } from "@/lib/validation";

const checkCreate = zodCheck(doctorCreateSchema);
const checkUpdate = zodCheck(doctorUpdateSchema);

export default function DoctorForm({ departments, doctor }) {
  const editing = Boolean(doctor);
  const [state, action] = useActionState(editing ? updateDoctor : createDoctor, {});
  const { clientErrors, onSubmit } = useClientValidation(editing ? checkUpdate : checkCreate);
  const e = clientErrors ?? state.errors ?? {};
  const v = state.values ?? doctor ?? {};

  return (
    <form action={action} onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Alert>{state.error}</Alert>
      </div>
      {editing && <input type="hidden" name="id" value={doctor.id} />}
      <Field label="Full name (without Dr.)" error={e.name}>
        <input name="name" required maxLength={100} className="input" defaultValue={v.name} />
      </Field>
      <Field label="Department" error={e.departmentId}>
        <select name="departmentId" required className="input" defaultValue={v.departmentId ?? ""}>
          <option value="" disabled>
            Select department
          </option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Qualification" error={e.qualification}>
        <input
          name="qualification"
          required
          maxLength={100}
          placeholder="e.g. MBBS, MD (Medicine)"
          className="input"
          defaultValue={v.qualification}
        />
      </Field>
      <Field label="Phone" error={e.phone}>
        <input name="phone" required maxLength={10} inputMode="numeric" className="input" defaultValue={v.phone} />
      </Field>
      <Field label="Consultation fee (₹)" error={e.fee}>
        <input name="fee" type="number" min="0" step="1" required className="input" defaultValue={v.fee} />
      </Field>

      {editing ? (
        <Field label="Login email">
          <input className="input" value={doctor.email} disabled />
        </Field>
      ) : (
        <>
          <div className="border-t border-slate-200 pt-4 sm:col-span-2">
            <h3 className="font-medium">Login account</h3>
            <p className="text-xs text-slate-500">The doctor logs in with these details and can change the password later.</p>
          </div>
          <Field label="Login email" error={e.email}>
            <input name="email" type="email" required className="input" defaultValue={v.email} />
          </Field>
          <Field label="Initial password" error={e.password}>
            <input name="password" type="password" required autoComplete="new-password" className="input" />
          </Field>
        </>
      )}

      <div className="flex gap-2 sm:col-span-2">
        <SubmitButton>{editing ? "Save changes" : "Add doctor"}</SubmitButton>
        <Link href="/admin/doctors" className="btn-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}
