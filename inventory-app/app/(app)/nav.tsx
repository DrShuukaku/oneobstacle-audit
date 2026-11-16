"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const icons: Record<string, React.ReactNode> = {
  Stock: <path d="M3 7l9-4 9 4-9 4-9-4zm0 0v10l9 4 9-4V7M12 11v10" />,
  Receive: <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v3h16v-3" />,
  Use: <path d="M5 12h14M4 5h16v14H4z" />,
  Dashboard: <path d="M4 20V10m6 10V4m6 16v-7m4 7H2" />,
  Vendors: <path d="M2 7h11v9H2zm11 3h5l3 3v3h-8M6.5 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm10 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />,
  More: <path d="M5 12h.01M12 12h.01M19 12h.01" />,
};

export function Nav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const links = [
    { href: "/", label: "Stock", match: (p: string) => p === "/" || p.startsWith("/items") },
    { href: "/receive", label: "Receive", match: (p: string) => p.startsWith("/receive") },
    { href: "/use", label: "Use", match: (p: string) => p.startsWith("/use") },
    isAdmin
      ? { href: "/dashboard", label: "Dashboard", match: (p: string) => p.startsWith("/dashboard") }
      : { href: "/vendors", label: "Vendors", match: (p: string) => p.startsWith("/vendors") },
    {
      href: "/more",
      label: "More",
      match: (p: string) => ["/more", "/activity", "/team"].some((x) => p.startsWith(x)) || (isAdmin && p.startsWith("/vendors")),
    },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-stone-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-2xl">
        {links.map((l) => {
          const active = l.match(pathname);
          return (
            <li key={l.href} className="flex-1">
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 py-2 text-xs font-medium ${active ? "text-accent" : "text-stone-500"}`}
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  {icons[l.label]}
                </svg>
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
