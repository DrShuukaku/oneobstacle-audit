import Link from "next/link";
import { fmtMoney } from "@/lib/format";
import type { DeliveryRow } from "@/lib/queries";
import { fmtDate } from "./page";
import { cardCls } from "./styles";

export function DeliveryList({ rows, showVendor }: { rows: DeliveryRow[]; showVendor?: boolean }) {
  if (rows.length === 0) return <p className="py-6 text-center text-sm text-stone-500">No deliveries recorded yet.</p>;
  return (
    <ul className={`${cardCls} divide-y divide-stone-100`}>
      {rows.map((d) => (
        <li key={d.id} className="flex items-start justify-between gap-3 px-4 py-3 text-sm">
          <div className="min-w-0">
            <p className="font-medium text-stone-900">
              {showVendor && (
                <>
                  <Link href={`/vendors/${d.vendor_id}`} className="text-accent">{d.vendor_name}</Link>
                  <span className="text-stone-400"> · </span>
                </>
              )}
              {fmtDate(d.received_on)}
            </p>
            <p className="text-stone-600">{d.summary}</p>
            <p className="text-stone-500">
              Received by {d.user_name}
              {d.invoice_number && <> · Invoice {d.invoice_number}</>}
            </p>
            {d.note && <p className="text-stone-600">“{d.note}”</p>}
          </div>
          <span className="shrink-0 font-semibold tabular-nums">{Number(d.total) > 0 ? fmtMoney(Number(d.total)) : "—"}</span>
        </li>
      ))}
    </ul>
  );
}
