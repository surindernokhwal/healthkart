"use client";

import { useActionState, useState } from "react";
import { bookAppointment } from "@/actions/patient";
import SubmitButton from "@/components/SubmitButton";
import { Alert } from "@/components/ui";
import { useClientValidation } from "@/components/useClientValidation";
import { formatDate, formatTime } from "@/lib/format";
import { bookingSchema, zodCheck } from "@/lib/validation";

const check = zodCheck(bookingSchema);

export default function SlotPicker({ slots, doctorId, doctorName, date, rescheduleId, fee }) {
  const [state, action, pending] = useActionState(bookAppointment, {});
  const { clientErrors, submitWithoutReset } = useClientValidation(check);
  const error = clientErrors ? Object.values(clientErrors)[0] : state.error;
  const [slot, setSlot] = useState("");
  const [reason, setReason] = useState("");

  const groups = [
    { label: "Morning", items: slots.filter((s) => s < "12:00") },
    { label: "Afternoon", items: slots.filter((s) => s >= "12:00" && s < "17:00") },
    { label: "Evening", items: slots.filter((s) => s >= "17:00") },
  ].filter((g) => g.items.length);

  return (
    <form onSubmit={submitWithoutReset(action)} noValidate className="space-y-5">
      <Alert>{error}</Alert>
      <input type="hidden" name="doctorId" value={doctorId} />
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="timeSlot" value={slot} />
      {rescheduleId && <input type="hidden" name="rescheduleId" value={rescheduleId} />}

      {groups.map((g) => (
        <div key={g.label}>
          <p className="mb-2 text-sm text-slate-500">{g.label}</p>
          <div className="flex flex-wrap gap-2">
            {g.items.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSlot(s)}
                aria-pressed={slot === s}
                className={`w-24 rounded-lg border py-2 text-sm font-medium transition ${
                  slot === s
                    ? "border-teal-700 bg-teal-700 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:border-teal-600"
                }`}
              >
                {formatTime(s)}
              </button>
            ))}
          </div>
        </div>
      ))}

      {!rescheduleId && (
        <div>
          <label className="label" htmlFor="reason">
            Reason for visit (optional)
          </label>
          <textarea
            id="reason"
            name="reason"
            rows={2}
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. fever for 3 days"
            className="input"
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 border-t border-slate-200 pt-4">
        <SubmitButton pending={pending} disabled={!slot || pending} pendingText="Booking...">
          {rescheduleId ? "Confirm new slot" : "Confirm booking"}
        </SubmitButton>
        <p className="text-sm text-slate-600">
          {slot ? (
            <>
              Dr. {doctorName} · {formatDate(date)} at <b>{formatTime(slot)}</b> · Fee {fee} (pay at the clinic)
            </>
          ) : (
            "Select a time slot"
          )}
        </p>
      </div>
    </form>
  );
}
