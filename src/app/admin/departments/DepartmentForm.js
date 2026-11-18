"use client";

import { useActionState, useEffect, useRef } from "react";
import { saveDepartment } from "@/actions/admin";
import SubmitButton from "@/components/SubmitButton";
import { Alert, Field } from "@/components/ui";
import { useClientValidation } from "@/components/useClientValidation";
import { departmentSchema, zodCheck } from "@/lib/validation";

const check = zodCheck(departmentSchema);

export default function DepartmentForm({ department }) {
  const [state, action] = useActionState(saveDepartment, {});
  const { clientErrors, onSubmit } = useClientValidation(check);
  const formRef = useRef(null);
  const e = clientErrors ?? state.errors ?? {};
  const v = state.values ?? department ?? {};

  useEffect(() => {
    if (state.reset) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} onSubmit={onSubmit} noValidate className="space-y-4">
      <Alert type="success">{state.success}</Alert>
      {department && <input type="hidden" name="id" value={department.id} />}
      <Field label="Name" error={e.name}>
        <input name="name" required maxLength={80} className="input" defaultValue={state.reset ? "" : v.name} />
      </Field>
      <Field label="Description (optional)" error={e.description}>
        <textarea
          name="description"
          rows={3}
          maxLength={500}
          className="input"
          defaultValue={state.reset ? "" : (v.description ?? "")}
        />
      </Field>
      <SubmitButton>{department ? "Save changes" : "Add department"}</SubmitButton>
    </form>
  );
}
