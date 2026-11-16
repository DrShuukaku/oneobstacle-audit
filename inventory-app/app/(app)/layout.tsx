import { requireUser } from "@/lib/auth";
import { Nav } from "./nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <>
      <main className="mx-auto max-w-2xl px-4 pb-28 pt-5">{children}</main>
      <Nav isAdmin={user.role === "admin"} />
    </>
  );
}
