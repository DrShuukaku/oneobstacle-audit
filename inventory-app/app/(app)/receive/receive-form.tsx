"use client";

import { useState } from "react";
import { receiveDelivery } from "@/app/actions";
import { ActionForm } from "@/components/action-form";
import { inputCls, labelCls } from "@/components/styles";
import { fmtMoney } from "@/lib/format";

type Item = { id: number; name: string; category: string; unit: string; vendorId: number | null };
type Line = { key: number; itemId: string; qty: string; cost: string };

let nextKey = 1;
const blankLine = (itemId = ""): Line => ({ key: nextKey++, itemId, qty: "", cost: "" });

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function ReceiveForm({ items, vendors, initialItemId }: { items: Item[]; vendors: { id: number; name: string }[]; initialItemId?: number }) {
  const initialItem = items.find((i) => i.id === initialItemId);
  const [vendorId, setVendorId] = useState(initialItem?.vendorId ? String(initialItem.vendorId) : "");
  const [lines, setLines] = useState<Line[]>(() => [blankLine(initialItem ? String(initialItem.id) : "")]);

  // Bumped after each save so the invoice and note fields start empty for the next delivery.
  const [saves, setSaves] = useState(0);

  const update = (key: number, patch: Partial<Line>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const total = lines.reduce((sum, l) => sum + (Number(l.cost) || 0), 0);
  const categories = [...new Set(items.map((i) => i.category))];

  return (
    <ActionForm
      action={receiveDelivery}
      submitLabel="Save delivery"
      keepValues
      onSuccess={() => {
        setLines([blankLine()]);
        setVendorId("");
        setSaves((n) => n + 1);
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label htmlFor="vendor_id" className={labelCls}>Vendor</label>
          <select id="vendor_id" name="vendor_id" required value={vendorId} onChange={(e) => setVendorId(e.target.value)} className={inputCls}>
            <option value="">Choose a vendor</option>
            {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="received_on" className={labelCls}>Date</label>
          <input id="received_on" name="received_on" type="date" required
            // Filled in on the device so it is the restaurant's local date, not the server's.
            ref={(el) => {
              if (el && !el.value) el.value = today();
            }}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="invoice_number" className={labelCls}>Invoice # (optional)</label>
          <input key={`invoice-${saves}`} id="invoice_number" name="invoice_number" className={inputCls} />
        </div>
      </div>

      <input type="hidden" name="lines" value={JSON.stringify(lines.map(({ itemId, qty, cost }) => ({ itemId, qty, cost })))} />

      <div className="space-y-3">
        {lines.map((line, index) => {
          const item = items.find((i) => String(i.id) === line.itemId);
          const qty = Number(line.qty);
          const cost = Number(line.cost);
          return (
            <fieldset key={line.key} className="rounded-xl border border-stone-200 bg-white p-3">
              <div className="mb-2 flex items-center justify-between">
                <legend className="text-sm font-semibold text-stone-700">Item {index + 1}</legend>
                {lines.length > 1 && (
                  <button type="button" onClick={() => setLines((ls) => ls.filter((l) => l.key !== line.key))} className="text-sm font-medium text-red-700">
                    Remove
                  </button>
                )}
              </div>
              <select aria-label={`Item ${index + 1}`} value={line.itemId} onChange={(e) => update(line.key, { itemId: e.target.value })} className={inputCls}>
                <option value="">Choose an item</option>
                {categories.map((c) => (
                  <optgroup key={c} label={c}>
                    {items.filter((i) => i.category === c).map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </optgroup>
                ))}
              </select>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor={`qty-${line.key}`} className={labelCls}>{item ? `Amount (${item.unit})` : "Amount"}</label>
                  <input id={`qty-${line.key}`} inputMode="decimal" value={line.qty} onChange={(e) => update(line.key, { qty: e.target.value })} placeholder="0" className={inputCls} />
                </div>
                <div>
                  <label htmlFor={`cost-${line.key}`} className={labelCls}>Total cost ($)</label>
                  <input id={`cost-${line.key}`} inputMode="decimal" value={line.cost} onChange={(e) => update(line.key, { cost: e.target.value })} placeholder="Optional" className={inputCls} />
                </div>
              </div>
              {item && qty > 0 && cost > 0 && (
                <p className="mt-1.5 text-sm text-stone-600">= {fmtMoney(cost / qty)} per {item.unit}</p>
              )}
            </fieldset>
          );
        })}
        <button type="button" onClick={() => setLines((ls) => [...ls, blankLine()])} className="w-full rounded-lg border border-dashed border-stone-400 py-2.5 text-sm font-semibold text-stone-700">
          + Add another item
        </button>
      </div>

      <div>
        <label htmlFor="note" className={labelCls}>Note (optional)</label>
        <input key={`note-${saves}`} id="note" name="note" placeholder="e.g. box arrived damaged" className={inputCls} />
      </div>
      {total > 0 && (
        <p className="flex justify-between border-t border-stone-200 pt-3 text-base">
          <span className="text-stone-600">Delivery total</span>
          <strong className="tabular-nums">{fmtMoney(total)}</strong>
        </p>
      )}
    </ActionForm>
  );
}
