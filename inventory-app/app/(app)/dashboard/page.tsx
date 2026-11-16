import Link from "next/link";
import { DeliveryList } from "@/components/delivery-list";
import { MovementList } from "@/components/movement-list";
import { PageHeader } from "@/components/page";
import { cardCls } from "@/components/styles";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { fmtMoney, fmtQty } from "@/lib/format";
import { getDeliveries, getMovements, getSpendByVendor, getStock } from "@/lib/queries";

const PERIODS = [7, 30, 90];

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className={`${cardCls} p-4`}>
      <p className="text-sm text-stone-500">{label}</p>
      <p className="mt-0.5 text-2xl font-bold tabular-nums tracking-tight">{value}</p>
      {hint && <p className="text-xs text-stone-500">{hint}</p>}
    </div>
  );
}

const h2 = "mb-2 mt-7 px-1 text-sm font-semibold uppercase tracking-wide text-stone-500";

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  await requireAdmin();
  const requested = Number((await searchParams).days);
  const days = PERIODS.includes(requested) ? requested : 30;

  const [stock, spend, deliveries, activity, [waste]] = await Promise.all([
    getStock(),
    getSpendByVendor(days),
    getDeliveries({ limit: 5 }),
    getMovements({ limit: 8 }),
    sql<{ value: string }[]>`
      select coalesce(sum(-m.quantity * c.unit_cost), 0) as value
      from movements m
      join lateral (
        select unit_cost from movements r
        where r.item_id = m.item_id and r.type = 'receive' and r.unit_cost is not null
        order by r.created_at desc limit 1
      ) c on true
      where m.type = 'waste' and m.created_at > now() - make_interval(days => ${days})`,
  ]);

  const low = stock.filter((s) => s.is_low);
  const stockValue = stock.reduce((sum, s) => sum + Math.max(Number(s.on_hand), 0) * Number(s.last_cost ?? 0), 0);
  const totalSpend = spend.reduce((sum, s) => sum + Number(s.total), 0);
  const deliveryCount = spend.reduce((sum, s) => sum + s.deliveries, 0);
  const maxSpend = Math.max(...spend.map((s) => Number(s.total)), 1);

  return (
    <>
      <PageHeader title="Dashboard" />

      <div className="mb-3 flex gap-1 rounded-lg bg-stone-200/70 p-1 text-sm font-semibold" role="group" aria-label="Time period">
        {PERIODS.map((p) => (
          <Link
            key={p}
            href={`/dashboard?days=${p}`}
            aria-current={p === days ? "true" : undefined}
            className={`flex-1 rounded-md py-1.5 text-center ${p === days ? "bg-white text-stone-900 shadow-sm" : "text-stone-600"}`}
          >
            Last {p} days
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Tile label="Low on stock" value={String(low.length)} hint={low.length === 1 ? "item needs ordering" : "items need ordering"} />
        <Tile label="Spent" value={fmtMoney(totalSpend)} hint={`${deliveryCount} ${deliveryCount === 1 ? "delivery" : "deliveries"} in ${days} days`} />
        <Tile label="Stock value" value={fmtMoney(stockValue)} hint="on hand, at last price paid" />
        <Tile label="Waste" value={fmtMoney(Number(waste.value))} hint={`in ${days} days, at last price paid`} />
      </div>

      <h2 className={h2}>Needs ordering</h2>
      {low.length === 0 ? (
        <p className={`${cardCls} px-4 py-5 text-center text-sm text-stone-600`}>
          Nothing is low right now. Items show up here when they reach the warning level set on them.
        </p>
      ) : (
        <ul className={`${cardCls} divide-y divide-stone-100`}>
          {low.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <span className="min-w-0">
                <Link href={`/items/${s.id}`} className="block truncate font-medium text-accent">{s.name}</Link>
                <span className="text-stone-500">
                  {s.vendor_id ? (
                    <>Order from <Link href={`/vendors/${s.vendor_id}`} className="underline underline-offset-2">{s.vendor_name}</Link></>
                  ) : (
                    "No usual vendor set"
                  )}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block font-semibold tabular-nums text-stone-900">{fmtQty(s.on_hand, s.unit)} left</span>
                <span className="text-xs text-stone-500">warning at {fmtQty(s.low_stock_threshold ?? 0, s.unit)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      <h2 className={h2}>Spending by vendor · last {days} days</h2>
      {spend.length === 0 ? (
        <p className={`${cardCls} px-4 py-5 text-center text-sm text-stone-600`}>No deliveries with a cost in this period.</p>
      ) : (
        <ul className={`${cardCls} space-y-3 p-4`}>
          {spend.map((s) => (
            <li key={s.vendor_id} title={`${s.vendor_name}: ${fmtMoney(Number(s.total))} across ${s.deliveries} deliveries`}>
              <div className="mb-1 flex justify-between gap-3 text-sm">
                <Link href={`/vendors/${s.vendor_id}`} className="truncate font-medium text-stone-900">{s.vendor_name}</Link>
                <span className="shrink-0 tabular-nums text-stone-700">
                  {fmtMoney(Number(s.total))} <span className="text-stone-400">· {Math.round((Number(s.total) / totalSpend) * 100)}%</span>
                </span>
              </div>
              <div className="h-2.5">
                <div className="h-full rounded-r bg-accent" style={{ width: `${Math.max((Number(s.total) / maxSpend) * 100, 1)}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <h2 className={h2}>Latest deliveries</h2>
      <DeliveryList rows={deliveries} showVendor />

      <div className="mt-7 flex items-baseline justify-between px-1">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-500">Latest activity</h2>
        <Link href="/activity" className="text-sm font-medium text-accent">See all</Link>
      </div>
      <MovementList rows={activity} showItem />
    </>
  );
}
