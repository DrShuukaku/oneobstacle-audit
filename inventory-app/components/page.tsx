import Link from "next/link";

export function PageHeader({ title, back, action }: { title: string; back?: { href: string; label: string }; action?: React.ReactNode }) {
  return (
    <header className="mb-4">
      {back && (
        <Link href={back.href} className="mb-1 inline-block text-sm font-medium text-accent">
          ‹ {back.label}
        </Link>
      )}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">{title}</h1>
        {action}
      </div>
    </header>
  );
}

export function LowBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
      <span aria-hidden>▲</span> Low
    </span>
  );
}

export function fmtDate(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}
