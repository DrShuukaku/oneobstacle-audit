"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import type { FormState } from "@/app/actions";
import { btnCls } from "./styles";

type Props = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  children: React.ReactNode;
  /** Called after a successful save (the form's plain fields are cleared automatically). */
  onSuccess?: () => void;
  /** Keep the typed values after a successful save. */
  keepValues?: boolean;
};

export function ActionForm({ action, submitLabel, children, onSuccess, keepValues }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  // The last result is hidden again as soon as the person starts typing the next entry.
  const [dismissed, setDismissed] = useState<FormState>(undefined);
  const shown = state === dismissed ? undefined : state;
  const ref = useRef<HTMLFormElement>(null);
  const onSuccessRef = useRef(onSuccess);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  });

  useEffect(() => {
    if (!state?.ok) return;
    if (!keepValues) ref.current?.reset();
    onSuccessRef.current?.();
  }, [state, keepValues]);

  return (
    <form
      ref={ref}
      className="space-y-4"
      // Submitting by hand keeps what was typed if the server reports a problem.
      onInput={() => setDismissed(state)}
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
    >
      {children}
      {shown?.error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">
          {shown.error}
        </p>
      )}
      {shown?.ok && !pending && (
        <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900">
          ✓ {shown.ok}
        </p>
      )}
      <button type="submit" disabled={pending} className={`${btnCls} w-full`}>
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
