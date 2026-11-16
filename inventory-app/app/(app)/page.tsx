import Link from "next/link";
import { PageHeader } from "@/components/page";
import { btnCls, btnGhostCls } from "@/components/styles";
import { getStock } from "@/lib/queries";
import { StockList } from "./stock-list";

export default async function StockPage() {
  const rows = await getStock();
  const items = rows.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    unit: r.unit,
    onHand: Number(r.on_hand),
    threshold: r.low_stock_threshold === null ? null : Number(r.low_stock_threshold),
    isLow: r.is_low,
  }));

  return (
    <>
      <PageHeader title="Stock" action={<Link href="/items/new" className={btnGhostCls}>+ Add item</Link>} />
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white px-5 py-10 text-center">
          <p className="font-medium text-stone-900">Nothing here yet</p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-stone-600">
            Add the things you keep track of: fish by weight, plates and supplies by count.
          </p>
          <Link href="/items/new" className={`${btnCls} mt-4`}>Add your first item</Link>
        </div>
      ) : (
        <StockList items={items} />
      )}
    </>
  );
}
