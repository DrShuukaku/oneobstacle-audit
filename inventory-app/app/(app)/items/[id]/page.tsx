import Link from "next/link";
import { notFound } from "next/navigation";
import { MovementList } from "@/components/movement-list";
import { LowBadge, PageHeader } from "@/components/page";
import { btnCls, btnGhostCls, cardCls } from "@/components/styles";
import { requireUser } from "@/lib/auth";
import { fmtMoney, fmtQty } from "@/lib/format";
import { getMovements, getStock } from "@/lib/queries";
import { CountForm } from "./count-form";

export default async function ItemPage({ params }: PageProps<"/items/[id]">) {
  const user = await requireUser();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [[item], history] = await Promise.all([getStock({ id, includeInactive: true }), getMovements({ itemId: id, limit: 40 })]);
  if (!item) notFound();

  return (
    <>
      <PageHeader
        title={item.name}
        back={{ href: "/", label: "Stock" }}
        action={<Link href={`/items/${id}/edit`} className={btnGhostCls}>Edit</Link>}
      />

      <section className={`${cardCls} p-4`}>
        <p className="text-sm text-stone-500">On hand</p>
        <p className="flex items-center gap-3">
          <span className="text-4xl font-bold tabular-nums tracking-tight">{fmtQty(item.on_hand, item.unit)}</span>
          {item.is_low && <LowBadge />}
        </p>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <dt className="text-stone-500">Category</dt>
            <dd>{item.category}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Low-stock warning</dt>
            <dd>{item.low_stock_threshold === null ? "Not set" : `At ${fmtQty(item.low_stock_threshold, item.unit)}`}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Usual vendor</dt>
            <dd>
              {item.vendor_id ? <Link href={`/vendors/${item.vendor_id}`} className="text-accent">{item.vendor_name}</Link> : "None"}
            </dd>
          </div>
          <div>
            <dt className="text-stone-500">Last price paid</dt>
            <dd>{item.last_cost === null ? "No record" : `${fmtMoney(Number(item.last_cost))} per ${item.unit}`}</dd>
          </div>
        </dl>
        {item.notes && <p className="mt-3 text-sm text-stone-600">{item.notes}</p>}
        {!item.active && <p className="mt-3 text-sm font-medium text-stone-600">This item is hidden from the stock list.</p>}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link href={`/use?item=${id}`} className={btnCls}>Use / deduct</Link>
          <Link href={`/receive?item=${id}`} className={btnGhostCls}>Receive more</Link>
        </div>
      </section>

      <details className={`${cardCls} mt-3 p-4`}>
        <summary className="cursor-pointer font-semibold text-stone-900">Correct the count</summary>
        <p className="mb-3 mt-2 text-sm text-stone-600">
          Use this when the number above doesn&apos;t match what is really on the shelf. The difference is saved in the history.
        </p>
        <CountForm itemId={id} unit={item.unit} />
      </details>

      <h2 className="mb-2 mt-6 px-1 text-sm font-semibold uppercase tracking-wide text-stone-500">History</h2>
      <MovementList rows={history} canDelete={user.role === "admin"} />
    </>
  );
}
