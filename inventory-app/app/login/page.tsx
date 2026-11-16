import { redirect } from "next/navigation";
import { login } from "@/app/actions";
import { ActionForm } from "@/components/action-form";
import { inputCls, labelCls } from "@/components/styles";
import { getUser } from "@/lib/auth";
import { sql } from "@/lib/db";

export default async function LoginPage() {
  if (await getUser()) redirect("/");
  const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from users`;
  if (n === 0) redirect("/setup");

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Kitchen Inventory</h1>
      <p className="mb-6 mt-1 text-stone-600">Sign in to continue.</p>
      <ActionForm action={login} submitLabel="Sign in" keepValues>
        <div>
          <label htmlFor="username" className={labelCls}>Username</label>
          <input id="username" name="username" autoComplete="username" autoCapitalize="none" autoCorrect="off" required className={inputCls} />
        </div>
        <div>
          <label htmlFor="password" className={labelCls}>Passcode</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required className={inputCls} />
        </div>
      </ActionForm>
    </main>
  );
}
