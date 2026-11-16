import Link from "next/link";
import { fmtDate, PageHeader } from "@/components/page";
import { btnCls, btnGhostCls, cardCls } from "@/components/styles";
import { requireUser } from "@/lib/auth";
import { fmtMoney } from "@/lib/format";
import { getVendors } from "@/lib/queries";

export default async function VendorsPage() {
  const user = await requireUser();
  const vendors = await getVendors({ includeInactive: true });
  return (
    <>
      <PageHeader title="Vendors" action={<Link href="/vendors/new" className={btnGhostCls}>+ Add vendor</Link>} />
      {vendors.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white px-5 py-10 text-center">
          <p className="font-medium text-stone-900">No vendors yet</p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-stone-600">Add the companies that deliver to you, with who to call.</p>
          <Link href="/vendors/new" className={`${btnCls} mt-4`}>Add your first vendor</Link>
        </div>
      ) : (
        <ul className={`${cardCls} divide-y divide-stone-100`}>
          {vendors.map((v) => (
            <li key={v.id}>
              <Link href={`/vendors/${v.id}`} className="flex items-center justify-between gap-3 px-4 py-3 active:bg-stone-50">
                <span className="min-w-0">
                  <span className="block truncate font-medium text-stone-900">
                    {v.name}
                    {!v.active && <span className="ml-2 text-xs font-normal text-stone-500">(not in use)</span>}
                  </span>
                  <span className="text-sm text-stone-500">
                    {v.last_delivery ? `Last delivery ${fmtDate(v.last_delivery)}` : "No deliveries yet"}
                  </span>
                </span>
                {user.role === "admin" && (
                  <span className="shrink-0 text-right">
                    <span className="block font-semibold tabular-nums">{fmtMoney(Number(v.spend_30d))}</span>
                    <span className="text-xs text-stone-500">last 30 days</span>
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
