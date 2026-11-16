"use client";

import { saveItem } from "@/app/actions";
import { ActionForm } from "@/components/action-form";
import { inputCls, labelCls } from "@/components/styles";
import { CATEGORIES, UNITS } from "@/lib/format";

type Item = { id: number; name: string; category: string; unit: string; threshold: string; vendorId: number | null; notes: string; active: boolean };

export function ItemForm({ item, vendors, categories }: { item?: Item; vendors: { id: number; name: string }[]; categories: string[] }) {
  const allCategories = [...new Set([...CATEGORIES, ...categories])];
  return (
    <ActionForm action={saveItem} submitLabel={item ? "Save changes" : "Add item"} keepValues>
      {item && <input type="hidden" name="id" value={item.id} />}
      <div>
        <label htmlFor="name" className={labelCls}>Name</label>
        <input id="name" name="name" required defaultValue={item?.name} placeholder="e.g. Salmon, Bento box, Soy sauce" className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="category" className={labelCls}>Category</label>
          <input id="category" name="category" list="category-list" defaultValue={item?.category ?? ""} placeholder="Choose or type" className={inputCls} />
          <datalist id="category-list">
            {allCategories.map((c) => <option key={c} value={c} />)}
          </datalist>
        </div>
        <div>
          <label htmlFor="unit" className={labelCls}>Measured in</label>
          <select id="unit" name="unit" defaultValue={item?.unit ?? "lb"} className={inputCls}>
            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="low_stock_threshold" className={labelCls}>Warn when stock is at or below</label>
        <input id="low_stock_threshold" name="low_stock_threshold" inputMode="decimal" defaultValue={item?.threshold} placeholder="Leave empty for no warning" className={inputCls} />
      </div>
      <div>
        <label htmlFor="vendor_id" className={labelCls}>Usual vendor</label>
        <select id="vendor_id" name="vendor_id" defaultValue={item?.vendorId ?? ""} className={inputCls}>
          <option value="">None</option>
          {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="notes" className={labelCls}>Notes</label>
        <textarea id="notes" name="notes" rows={2} defaultValue={item?.notes} className={inputCls} />
      </div>
      {item && (
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input type="hidden" name="active_present" value="1" />
          <input type="checkbox" name="active" value="on" defaultChecked={item.active} className="h-5 w-5 accent-accent" />
          Still in use (untick to hide it from the stock list)
        </label>
      )}
    </ActionForm>
  );
}
