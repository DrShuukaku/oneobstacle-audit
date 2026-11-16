import { redirect } from "next/navigation";
import { setup } from "@/app/actions";
import { ActionForm } from "@/components/action-form";
import { inputCls, labelCls } from "@/components/styles";
import { sql } from "@/lib/db";

export default async function SetupPage() {
  const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from users`;
  if (n > 0) redirect("/login");

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Welcome</h1>
      <p className="mb-6 mt-1 text-stone-600">
        Create the first account. It will be an admin, and can add everyone else afterwards.
      </p>
      <ActionForm action={setup} submitLabel="Create account" keepValues>
        <div>
          <label htmlFor="name" className={labelCls}>Your name</label>
          <input id="name" name="name" required className={inputCls} />
        </div>
        <div>
          <label htmlFor="username" className={labelCls}>Username</label>
          <input id="username" name="username" autoCapitalize="none" autoCorrect="off" required className={inputCls} />
        </div>
        <div>
          <label htmlFor="password" className={labelCls}>Passcode (6 or more characters)</label>
          <input id="password" name="password" type="password" autoComplete="new-password" required minLength={6} className={inputCls} />
        </div>
      </ActionForm>
    </main>
  );
}
