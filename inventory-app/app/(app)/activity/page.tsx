import Link from "next/link";
import { MovementList } from "@/components/movement-list";
import { PageHeader } from "@/components/page";
import { btnGhostCls } from "@/components/styles";
import { requireUser } from "@/lib/auth";
import { getMovements } from "@/lib/queries";

const FILTERS = [
  { value: "", label: "All" },
  { value: "receive", label: "Received" },
  { value: "use", label: "Used" },
  { value: "waste", label: "Waste" },
  { value: "count", label: "Corrections" },
];
const PAGE = 50;

export default async function ActivityPage({ searchParams }: PageProps<"/activity">) {
  const user = await requireUser();
  const sp = await searchParams;
  const type = FILTERS.some((f) => f.value === sp.type) ? String(sp.type) : "";
  const page = Math.max(Number(sp.page) || 0, 0);
  const rows = await getMovements({ type: type || undefined, limit: PAGE + 1, offset: page * PAGE });
  const href = (p: number) => `/activity?${new URLSearchParams({ ...(type && { type }), ...(p > 0 && { page: String(p) }) })}`;

  return (
    <>
      <PageHeader title="Activity" back={{ href: "/more", label: "More" }} />
      <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value ? `/activity?type=${f.value}` : "/activity"}
            aria-current={f.value === type ? "true" : undefined}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium ${
              f.value === type ? "border-accent bg-accent text-white" : "border-stone-300 bg-white text-stone-700"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>
      <MovementList rows={rows.slice(0, PAGE)} showItem canDelete={user.role === "admin"} />
      <div className="mt-4 flex justify-between">
        {page > 0 ? <Link href={href(page - 1)} className={btnGhostCls}>‹ Newer</Link> : <span />}
        {rows.length > PAGE && <Link href={href(page + 1)} className={btnGhostCls}>Older ›</Link>}
      </div>
    </>
  );
}
