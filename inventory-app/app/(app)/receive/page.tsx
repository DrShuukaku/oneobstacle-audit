import Link from "next/link";
import { PageHeader } from "@/components/page";
import { btnCls } from "@/components/styles";
import { getStock, getVendors } from "@/lib/queries";
import { ReceiveForm } from "./receive-form";

export default async function ReceivePage({ searchParams }: PageProps<"/receive">) {
  const initial = Number((await searchParams).item);
  const [stock, vendors] = await Promise.all([getStock(), getVendors()]);
  const missing = vendors.length === 0 ? "vendor" : stock.length === 0 ? "item" : null;

  return (
    <>
      <PageHeader title="Receive delivery" />
      {missing ? (
        <div className="rounded-xl border border-dashed border-stone-300 bg-white px-5 py-10 text-center">
          <p className="font-medium text-stone-900">Add {missing === "vendor" ? "a vendor" : "an item"} first</p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-stone-600">
            A delivery needs a vendor it came from and at least one item to add to stock.
          </p>
          <Link href={missing === "vendor" ? "/vendors/new" : "/items/new"} className={`${btnCls} mt-4`}>
            Add {missing === "vendor" ? "a vendor" : "an item"}
          </Link>
        </div>
      ) : (
        <ReceiveForm
          items={stock.map((r) => ({ id: r.id, name: r.name, category: r.category, unit: r.unit, vendorId: r.vendor_id }))}
          vendors={vendors.map((v) => ({ id: v.id, name: v.name }))}
          initialItemId={Number.isInteger(initial) ? initial : undefined}
        />
      )}
    </>
  );
}
