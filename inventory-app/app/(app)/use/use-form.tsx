"use client";

import { useState } from "react";
import { recordUse } from "@/app/actions";
import { ActionForm } from "@/components/action-form";
import { inputCls, labelCls } from "@/components/styles";
import { fmtQty } from "@/lib/format";

type Item = { id: number; name: string; category: string; unit: string; onHand: number };

export function UseForm({ items, initialItemId }: { items: Item[]; initialItemId?: number }) {
  const [itemId, setItemId] = useState<number | "">(initialItemId ?? "");
  const item = items.find((i) => i.id === itemId);
  const categories = [...new Set(items.map((i) => i.category))];

  return (
    <ActionForm action={recordUse} submitLabel="Deduct from stock">
      <div>
        <label htmlFor="item_id" className={labelCls}>Item</label>
        <select
          id="item_id"
          name="item_id"
          required
          value={itemId}
          onChange={(e) => setItemId(e.target.value ? Number(e.target.value) : "")}
          className={inputCls}
        >
          <option value="">Choose an item</option>
          {categories.map((c) => (
            <optgroup key={c} label={c}>
              {items.filter((i) => i.category === c).map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </optgroup>
          ))}
        </select>
        {item && <p className="mt-1 text-sm text-stone-600">On hand now: <strong>{fmtQty(item.onHand, item.unit)}</strong></p>}
      </div>
      <div>
        <label htmlFor="quantity" className={labelCls}>Amount{item ? ` (${item.unit})` : ""}</label>
        <input id="quantity" name="quantity" inputMode="decimal" required placeholder="0" className={`${inputCls} py-3 text-2xl font-semibold tabular-nums`} style={{ fontSize: 24 }} />
      </div>
      <fieldset>
        <legend className={labelCls}>Reason</legend>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: "use", label: "Used" },
            { value: "waste", label: "Waste / spoiled" },
          ].map((o) => (
            <label key={o.value} className="flex cursor-pointer items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2.5 has-checked:border-accent has-checked:bg-accent-soft">
              <input type="radio" name="type" value={o.value} defaultChecked={o.value === "use"} className="h-4 w-4 accent-accent" />
              <span className="text-sm font-medium">{o.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="note" className={labelCls}>Note (optional)</label>
        <input id="note" name="note" className={inputCls} />
      </div>
    </ActionForm>
  );
}
