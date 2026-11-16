import Link from "next/link";
import { logout } from "@/app/actions";
import { PageHeader } from "@/components/page";
import { btnGhostCls, cardCls } from "@/components/styles";
import { requireUser } from "@/lib/auth";

export default async function MorePage() {
  const user = await requireUser();
  const isAdmin = user.role === "admin";
  const links = [
    { href: "/vendors", label: "Vendors", hint: "Contacts, deliveries and prices" },
    { href: "/activity", label: "Activity", hint: "Everything that went in or out" },
    ...(isAdmin ? [{ href: "/team", label: "Team", hint: "Who can sign in" }] : []),
  ];
  return (
    <>
      <PageHeader title="More" />
      <ul className={`${cardCls} divide-y divide-stone-100`}>
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="flex items-center justify-between px-4 py-3.5 active:bg-stone-50">
              <span>
                <span className="block font-medium text-stone-900">{l.label}</span>
                <span className="text-sm text-stone-500">{l.hint}</span>
              </span>
              <span aria-hidden className="text-stone-400">›</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex items-center justify-between px-1">
        <p className="text-sm text-stone-600">
          Signed in as <strong>{user.name}</strong> ({isAdmin ? "admin" : "staff"})
        </p>
        <form action={logout}>
          <button type="submit" className={btnGhostCls}>Sign out</button>
        </form>
      </div>
    </>
  );
}
