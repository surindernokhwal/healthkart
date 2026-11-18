"use client";

import { useActionState, useState } from "react";
import { savePrescription } from "@/actions/doctor";
import SubmitButton from "@/components/SubmitButton";
import { Alert, Field } from "@/components/ui";
import { useClientValidation } from "@/components/useClientValidation";
import { MEDICINE_TYPES, prescriptionSchema, readPrescriptionForm, zodCheck } from "@/lib/validation";

const check = zodCheck(prescriptionSchema, readPrescriptionForm);

let nextKey = 0;
const blankItem = () => ({ key: ++nextKey, medicine: "", type: "Tablet", dosage: "", durationDays: 5 });

export default function PrescriptionForm({ appointmentId, medicines }) {
  const [state, action, pending] = useActionState(savePrescription, {});
  const { clientErrors, submitWithoutReset } = useClientValidation(check);
  const [items, setItems] = useState(() => [blankItem()]);
  // Controlled, so the text survives a failed validation (React resets uncontrolled fields)
  const [diagnosis, setDiagnosis] = useState("");
  const [advice, setAdvice] = useState("");
  const e = clientErrors ?? state.errors ?? {};
  const typeOf = new Map(medicines.map((m) => [m.name.toLowerCase(), m.type]));

  function update(index, field, value) {
    setItems((list) =>
      list.map((it, i) => {
        if (i !== index) return it;
        const next = { ...it, [field]: value };
        // Known medicine: fill in its type automatically
        if (field === "medicine" && typeOf.has(value.toLowerCase())) next.type = typeOf.get(value.toLowerCase());
        return next;
      })
    );
  }

  return (
    <form onSubmit={submitWithoutReset(action)} noValidate className="space-y-4">
      <Alert>{state.error}</Alert>
      <input type="hidden" name="appointmentId" value={appointmentId} />
      <input
        type="hidden"
        name="items"
        value={JSON.stringify(items.map(({ key, ...rest }) => rest))}
      />

      <Field label="Diagnosis" error={e.diagnosis}>
        <textarea
          name="diagnosis"
          required
          rows={2}
          maxLength={2000}
          className="input"
          value={diagnosis}
          onChange={(ev) => setDiagnosis(ev.target.value)}
        />
      </Field>

      <div>
        <p className="label">Medicines</p>
        <datalist id="medicine-list">
          {medicines.map((m) => (
            <option key={m.name} value={m.name} />
          ))}
        </datalist>
        <div className="space-y-3">
          {items.map((it, i) => (
            <div key={it.key} className="rounded-lg border border-slate-200 p-3">
              <div className="grid gap-2 sm:grid-cols-[2fr_1fr]">
                <input
                  list="medicine-list"
                  placeholder="Medicine name"
                  value={it.medicine}
                  onChange={(ev) => update(i, "medicine", ev.target.value)}
                  maxLength={100}
                  className="input"
                  aria-label="Medicine name"
                />
                <select
                  value={it.type}
                  onChange={(ev) => update(i, "type", ev.target.value)}
                  className="input"
                  aria-label="Type"
                >
                  {MEDICINE_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
                <input
                  placeholder="Dosage, e.g. 1-0-1 after food"
                  value={it.dosage}
                  onChange={(ev) => update(i, "dosage", ev.target.value)}
                  maxLength={50}
                  className="input"
                  aria-label="Dosage"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={it.durationDays}
                    onChange={(ev) => update(i, "durationDays", ev.target.value)}
                    className="input"
                    aria-label="Duration in days"
                  />
                  <span className="text-sm text-slate-500">days</span>
                </div>
              </div>
              {Object.entries(e)
                .filter(([k]) => k.startsWith(`items.${i}.`))
                .map(([k, msg]) => (
                  <p key={k} className="error-text">
                    {msg}
                  </p>
                ))}
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => setItems((list) => list.filter((_, j) => j !== i))}
                  className="mt-2 text-xs text-red-700 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
        {e.items && <p className="error-text">{e.items}</p>}
        {items.length < 20 && (
          <button type="button" onClick={() => setItems((l) => [...l, blankItem()])} className="btn-secondary btn-sm mt-3">
            + Add medicine
          </button>
        )}
      </div>

      <Field label="Advice (optional)" error={e.advice}>
        <textarea
          name="advice"
          rows={2}
          maxLength={2000}
          placeholder="Diet, rest, follow-up..."
          className="input"
          value={advice}
          onChange={(ev) => setAdvice(ev.target.value)}
        />
      </Field>

      <SubmitButton pending={pending} pendingText="Saving...">
        Save prescription and complete visit
      </SubmitButton>
    </form>
  );
}
