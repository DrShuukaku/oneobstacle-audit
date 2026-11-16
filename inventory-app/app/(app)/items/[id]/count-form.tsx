"use client";

import { recordCount } from "@/app/actions";
import { ActionForm } from "@/components/action-form";
import { inputCls, labelCls } from "@/components/styles";

export function CountForm({ itemId, unit }: { itemId: number; unit: string }) {
  return (
    <ActionForm action={recordCount} submitLabel="Set stock to this amount">
      <input type="hidden" name="item_id" value={itemId} />
      <div>
        <label htmlFor="counted" className={labelCls}>What you actually counted or weighed ({unit})</label>
        <input id="counted" name="counted" inputMode="decimal" required className={inputCls} />
      </div>
      <div>
        <label htmlFor="count-note" className={labelCls}>Note (optional)</label>
        <input id="count-note" name="note" placeholder="e.g. 2 plates broke" className={inputCls} />
      </div>
    </ActionForm>
  );
}
