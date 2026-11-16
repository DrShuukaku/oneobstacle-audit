"use client";

import { deleteMovement } from "@/app/actions";

export function DeleteMovementButton({ id, label }: { id: number; label: string }) {
  return (
    <form
      action={deleteMovement}
      onSubmit={(e) => {
        if (!window.confirm(`Delete this entry (${label})? Stock will change as if it never happened.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="text-xs font-medium text-red-700 underline-offset-2 hover:underline" aria-label={`Delete this entry: ${label}`}>
        Delete
      </button>
    </form>
  );
}
