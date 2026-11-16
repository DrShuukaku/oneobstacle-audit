import { PageHeader } from "@/components/page";
import { sql } from "@/lib/db";
import { getVendors } from "@/lib/queries";
import { ItemForm } from "../item-form";

export default async function NewItemPage() {
  const [vendors, cats] = await Promise.all([getVendors(), sql<{ category: string }[]>`select distinct category from items`]);
  return (
    <>
      <PageHeader title="Add item" back={{ href: "/", label: "Stock" }} />
      <ItemForm vendors={vendors.map((v) => ({ id: v.id, name: v.name }))} categories={cats.map((c) => c.category)} />
    </>
  );
}
