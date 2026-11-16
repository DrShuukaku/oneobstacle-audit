"use client";

import Link from "next/link";
import { useState } from "react";
import { LowBadge } from "@/components/page";
import { cardCls, inputCls } from "@/components/styles";
import { fmtQty } from "@/lib/format";

export type StockItem = { id: number; name: string; category: string; unit: string; onHand: number; threshold: number | null; isLow: boolean };

export function StockList({ items }: { items: StockItem[] }) {
  const [query, setQuery] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const lowCount = items.filter((i) => i.isLow).length;

  const q = query.trim().toLowerCase();
  const shown = items.filter(
    (i) => (!lowOnly || i.isLow) && (!q || i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)),
  );
  const groups = new Map<string, StockItem[]>();
  for (const item of shown) groups.set(item.category, [...(groups.get(item.category) ?? []), item]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search items"
          aria-label="Search items"
          className={inputCls}
        />
        <button
          type="button"
          onClick={() => setLowOnly((v) => !v)}
          aria-pressed={lowOnly}
          className={`shrink-0 rounded-lg border px-3 text-sm font-semibold ${
            lowOnly ? "border-amber-400 bg-amber-100 text-amber-900" : "border-stone-300 bg-white text-stone-700"
          }`}
        >
          Low ({lowCount})
        </button>
      </div>

      {shown.length === 0 && <p className="py-8 text-center text-stone-500">No items match.</p>}

      {[...groups.entries()].map(([category, rows]) => (
        <section key={category}>
          <h2 className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-stone-500">{category}</h2>
          <ul className={`${cardCls} divide-y divide-stone-100`}>
            {rows.map((item) => (
              <li key={item.id}>
                <Link href={`/items/${item.id}`} className="flex items-center justify-between gap-3 px-4 py-3 active:bg-stone-50">
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-stone-900">{item.name}</span>
                    {item.threshold !== null && (
                      <span className="text-xs text-stone-500">Low at {fmtQty(item.threshold, item.unit)}</span>
                    )}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {item.isLow && <LowBadge />}
                    <span className="text-lg font-semibold tabular-nums text-stone-900">{fmtQty(item.onHand, item.unit)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
