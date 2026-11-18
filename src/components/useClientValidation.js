"use client";

import { startTransition, useState } from "react";

// Client-side validation (synopsis 5.3 and security level 3): the form is
// checked in the browser with the same Zod schema the server action uses, so
// mistakes are shown instantly without a trip to the server. The server
// action still validates again, because browser checks can be bypassed.
//
//   check: (formData) => errors object, or null when valid
//          (use zodCheck(schema) or scheduleCheck from lib/validation.js)
export function useClientValidation(check) {
  const [clientErrors, setClientErrors] = useState(null);

  function isValid(formData) {
    const errors = check(formData);
    setClientErrors(errors);
    return !errors;
  }

  // For forms that use the `action` prop: stop the submit when invalid
  function onSubmit(event) {
    if (!isValid(new FormData(event.currentTarget))) event.preventDefault();
  }

  // For forms with controlled inputs: validate, then run the action inside a
  // transition so React does not auto-reset the fields afterwards
  function submitWithoutReset(formAction) {
    return (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      if (isValid(data)) startTransition(() => formAction(data));
    };
  }

  return { clientErrors, onSubmit, submitWithoutReset };
}
