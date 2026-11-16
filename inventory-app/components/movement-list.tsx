import Link from "next/link";
import { fmtMoney, fmtNum, MOVEMENT_LABEL } from "@/lib/format";
import type { MovementRow } from "@/lib/queries";
import { DeleteMovementButton } from "./delete-button";
import { LocalTime } from "./local-time";
import { cardCls } from "./styles";

export function MovementList({ rows, showItem, canDelete }: { rows: MovementRow[]; showItem?: boolean; canDelete?: boolean }) {
  if (rows.length === 0) return <p className="py-6 text-center text-sm text-stone-500">Nothing recorded yet.</p>;
  return (
    <ul className={`${cardCls} divide-y divide-stone-100`}>
      {rows.map((m) => {
        const qty = Number(m.quantity);
        return (
          <li key={m.id} className="flex items-start justify-between gap-3 px-4 py-3">
            <div className="min-w-0 text-sm">
              <p className="font-medium text-stone-900">
                {showItem && (
                  <>
                    <Link href={`/items/${m.item_id}`} className="text-accent">{m.item_name}</Link>
                    <span className="text-stone-400"> · </span>
                  </>
                )}
                {MOVEMENT_LABEL[m.type] ?? m.type}
                {m.vendor_name && <span className="font-normal text-stone-600"> from {m.vendor_name}</span>}
              </p>
              <p className="text-stone-500">
                <LocalTime value={m.created_at.toISOString()} /> · {m.user_name}
                {m.type === "receive" && m.unit_cost !== null && (
                  <> · {fmtMoney(Number(m.unit_cost))}/{m.unit}</>
                )}
              </p>
              {m.note && <p className="mt-0.5 text-stone-600">“{m.note}”</p>}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="font-semibold tabular-nums text-stone-900">
                {qty > 0 ? "+" : "−"}{fmtNum(Math.abs(qty))} {m.unit}
              </span>
              {canDelete && (
                <DeleteMovementButton id={m.id} label={`${MOVEMENT_LABEL[m.type] ?? m.type} ${fmtNum(Math.abs(qty))} ${m.unit} ${m.item_name}`} />
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
