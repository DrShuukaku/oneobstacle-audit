import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page";
import { sql } from "@/lib/db";
import { getStock, getVendors } from "@/lib/queries";
import { ItemForm } from "../../item-form";

export default async function EditItemPage({ params }: PageProps<"/items/[id]/edit">) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [[item], vendors, cats] = await Promise.all([
    getStock({ id, includeInactive: true }),
    getVendors({ includeInactive: true }),
    sql<{ category: string }[]>`select distinct category from items`,
  ]);
  if (!item) notFound();
  return (
    <>
      <PageHeader title="Edit item" back={{ href: `/items/${id}`, label: item.name }} />
      <ItemForm
        item={{
          id: item.id,
          name: item.name,
          category: item.category,
          unit: item.unit,
          threshold: item.low_stock_threshold === null ? "" : String(Number(item.low_stock_threshold)),
          vendorId: item.vendor_id,
          notes: item.notes,
          active: item.active,
        }}
        vendors={vendors.map((v) => ({ id: v.id, name: v.name }))}
        categories={cats.map((c) => c.category)}
      />
    </>
  );
}
