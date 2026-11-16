import { PageHeader } from "@/components/page";
import { getStock } from "@/lib/queries";
import { UseForm } from "./use-form";

export default async function UsePage({ searchParams }: PageProps<"/use">) {
  const initial = Number((await searchParams).item);
  const rows = await getStock();
  const items = rows.map((r) => ({ id: r.id, name: r.name, category: r.category, unit: r.unit, onHand: Number(r.on_hand) }));
  return (
    <>
      <PageHeader title="Use stock" />
      <p className="mb-4 text-stone-600">Weigh or count what you took, and enter it here.</p>
      <UseForm items={items} initialItemId={items.some((i) => i.id === initial) ? initial : undefined} />
    </>
  );
}
