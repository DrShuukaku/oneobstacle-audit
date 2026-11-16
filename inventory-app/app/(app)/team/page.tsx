import { PageHeader } from "@/components/page";
import { cardCls } from "@/components/styles";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { AddUserForm, EditUserForm } from "./team-forms";

export default async function TeamPage() {
  const me = await requireAdmin();
  const users = await sql<{ id: number; username: string; name: string; role: string; active: boolean }[]>`
    select id, username, name, role, active from users order by active desc, lower(name)`;
  return (
    <>
      <PageHeader title="Team" back={{ href: "/more", label: "More" }} />
      <div className="space-y-2">
        {users.map((u) => (
          <details key={u.id} className={`${cardCls} px-4 py-3`}>
            <summary className="flex cursor-pointer items-center justify-between gap-3">
              <span>
                <span className="font-medium text-stone-900">{u.name}</span>
                {u.id === me.id && <span className="text-stone-500"> (you)</span>}
                <span className="block text-sm text-stone-500">Signs in as “{u.username}”</span>
              </span>
              <span className="text-sm text-stone-600">{!u.active ? "Turned off" : u.role === "admin" ? "Admin" : "Staff"}</span>
            </summary>
            <div className="mt-3 border-t border-stone-100 pt-3">
              <EditUserForm user={u} />
            </div>
          </details>
        ))}
      </div>
      <h2 className="mb-2 mt-7 px-1 text-sm font-semibold uppercase tracking-wide text-stone-500">Add someone</h2>
      <div className={`${cardCls} p-4`}>
        <AddUserForm />
      </div>
    </>
  );
}
