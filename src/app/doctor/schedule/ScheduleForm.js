"use client";

import { useActionState, useState } from "react";
import { saveSchedule } from "@/actions/doctor";
import SubmitButton from "@/components/SubmitButton";
import { Alert } from "@/components/ui";
import { useClientValidation } from "@/components/useClientValidation";
import { WEEKDAYS } from "@/lib/time";
import { scheduleCheck } from "@/lib/validation";

const SLOT_OPTIONS = [10, 15, 20, 30, 45, 60];
// Show Monday first
const ORDER = [1, 2, 3, 4, 5, 6, 0];

export default function ScheduleForm({ initial }) {
  const [state, action, pending] = useActionState(saveSchedule, {});
  const { clientErrors, submitWithoutReset } = useClientValidation(scheduleCheck);
  const [days, setDays] = useState(initial);
  const errors = clientErrors ?? state.errors ?? {};

  const set = (i, field, value) => setDays((d) => d.map((day, j) => (j === i ? { ...day, [field]: value } : day)));

  return (
    <form onSubmit={submitWithoutReset(action)} className="space-y-4">
      <Alert type="success">{state.success}</Alert>
      {Object.keys(errors).length > 0 && <Alert>Please fix the highlighted days.</Alert>}

      <div className="divide-y divide-slate-100">
        {ORDER.map((i) => {
          const day = days[i];
          return (
            <div key={i} className="py-3">
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex w-32 items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    name={`works_${i}`}
                    checked={day.works}
                    onChange={(e) => set(i, "works", e.target.checked)}
                    className="h-4 w-4 accent-teal-700"
                  />
                  {WEEKDAYS[i]}
                </label>
                {day.works ? (
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <input
                      type="time"
                      name={`start_${i}`}
                      value={day.start}
                      onChange={(e) => set(i, "start", e.target.value)}
                      className="input w-auto"
                      aria-label={`${WEEKDAYS[i]} start time`}
                    />
                    <span className="text-slate-500">to</span>
                    <input
                      type="time"
                      name={`end_${i}`}
                      value={day.end}
                      onChange={(e) => set(i, "end", e.target.value)}
                      className="input w-auto"
                      aria-label={`${WEEKDAYS[i]} end time`}
                    />
                    <select
                      name={`slot_${i}`}
                      value={day.slot}
                      onChange={(e) => set(i, "slot", Number(e.target.value))}
                      className="input w-auto"
                      aria-label={`${WEEKDAYS[i]} slot duration`}
                    >
                      {SLOT_OPTIONS.map((m) => (
                        <option key={m} value={m}>
                          {m} min slots
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <span className="text-sm text-slate-400">Not working</span>
                )}
              </div>
              {errors[i] && <p className="error-text sm:ml-35">{errors[i]}</p>}
            </div>
          );
        })}
      </div>
      <SubmitButton pending={pending}>Save schedule</SubmitButton>
    </form>
  );
}
