import Link from "next/link";
import { notFound } from "next/navigation";
import { DeliveryList } from "@/components/delivery-list";
import { fmtDate, PageHeader } from "@/components/page";
import { btnGhostCls, cardCls } from "@/components/styles";
import { fmtMoney } from "@/lib/format";
import { getDeliveries, getVendorItems, getVendors } from "@/lib/queries";

export default async function VendorPage({ params }: PageProps<"/vendors/[id]">) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [[v], deliveries, items] = await Promise.all([
    getVendors({ id, includeInactive: true }),
    getDeliveries({ vendorId: id, limit: 30 }),
    getVendorItems(id),
  ]);
  if (!v) notFound();

  return (
    <>
      <PageHeader title={v.name} back={{ href: "/vendors", label: "Vendors" }} action={<Link href={`/vendors/${id}/edit`} className={btnGhostCls}>Edit</Link>} />

      <section className={`${cardCls} p-4 text-sm`}>
        {v.contact_name && <p className="text-base font-medium text-stone-900">{v.contact_name}</p>}
        {!v.contact_name && !v.phone && !v.email && <p className="text-stone-500">No contact details yet.</p>}
        <div className="mt-2 flex flex-wrap gap-2">
          {v.phone && <a href={`tel:${v.phone}`} className={btnGhostCls}>Call {v.phone}</a>}
          {v.phone && <a href={`sms:${v.phone}`} className={btnGhostCls}>Text</a>}
          {v.email && <a href={`mailto:${v.email}`} className={btnGhostCls}>Email</a>}
        </div>
        {v.notes && <p className="mt-3 whitespace-pre-line text-stone-700">{v.notes}</p>}
        <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-stone-100 pt-3">
          <div>
            <dt className="text-stone-500">Deliveries</dt>
            <dd className="text-lg font-semibold tabular-nums">{v.delivery_count}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Last 30 days</dt>
            <dd className="text-lg font-semibold tabular-nums">{fmtMoney(Number(v.spend_30d))}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Last delivery</dt>
            <dd className="font-semibold">{v.last_delivery ? fmtDate(v.last_delivery) : "—"}</dd>
          </div>
        </dl>
      </section>

      {items.length > 0 && (
        <>
          <h2 className="mb-2 mt-6 px-1 text-sm font-semibold uppercase tracking-wide text-stone-500">What they supply</h2>
          <ul className={`${cardCls} divide-y divide-stone-100`}>
            {items.map((i) => {
              const last = i.last_cost === null ? null : Number(i.last_cost);
              const prev = i.prev_cost === null ? null : Number(i.prev_cost);
              const change = last !== null && prev !== null && prev > 0 ? ((last - prev) / prev) * 100 : null;
              return (
                <li key={i.item_id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <Link href={`/items/${i.item_id}`} className="font-medium text-accent">{i.name}</Link>
                  <span className="text-right">
                    <span className="block font-semibold tabular-nums">{last === null ? "No price" : `${fmtMoney(last)} / ${i.unit}`}</span>
                    {change !== null && Math.abs(change) >= 0.5 && (
                      <span className="text-xs text-stone-600">
                        {change > 0 ? "▲ up" : "▼ down"} {Math.abs(change).toFixed(0)}% from the delivery before ({fmtMoney(prev)})
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <h2 className="mb-2 mt-6 px-1 text-sm font-semibold uppercase tracking-wide text-stone-500">Deliveries</h2>
      <DeliveryList rows={deliveries} />
    </>
  );
}
