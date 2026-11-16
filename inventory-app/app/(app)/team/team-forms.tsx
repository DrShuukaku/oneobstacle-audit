"use client";

import { addUser, updateUser } from "@/app/actions";
import { ActionForm } from "@/components/action-form";
import { inputCls, labelCls } from "@/components/styles";

const roleOptions = (
  <>
    <option value="staff">Staff: stock, deliveries, vendors</option>
    <option value="admin">Admin: everything, plus dashboard and team</option>
  </>
);

export function AddUserForm() {
  return (
    <ActionForm action={addUser} submitLabel="Add person">
      <div>
        <label htmlFor="new-name" className={labelCls}>Name</label>
        <input id="new-name" name="name" required className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="new-username" className={labelCls}>Username</label>
          <input id="new-username" name="username" required autoCapitalize="none" autoCorrect="off" className={inputCls} />
        </div>
        <div>
          <label htmlFor="new-password" className={labelCls}>Passcode (6+)</label>
          <input id="new-password" name="password" required minLength={6} autoComplete="off" className={inputCls} />
        </div>
      </div>
      <div>
        <label htmlFor="new-role" className={labelCls}>Access</label>
        <select id="new-role" name="role" defaultValue="staff" className={inputCls}>{roleOptions}</select>
      </div>
    </ActionForm>
  );
}

export function EditUserForm({ user }: { user: { id: number; role: string; active: boolean } }) {
  return (
    <ActionForm action={updateUser} submitLabel="Save" keepValues>
      <input type="hidden" name="id" value={user.id} />
      <div>
        <label htmlFor={`role-${user.id}`} className={labelCls}>Access</label>
        <select id={`role-${user.id}`} name="role" defaultValue={user.role} className={inputCls}>{roleOptions}</select>
      </div>
      <div>
        <label htmlFor={`pw-${user.id}`} className={labelCls}>New passcode (leave empty to keep the current one)</label>
        <input id={`pw-${user.id}`} name="password" autoComplete="off" className={inputCls} />
      </div>
      <label className="flex items-center gap-2 text-sm text-stone-700">
        <input type="checkbox" name="active" defaultChecked={user.active} className="h-5 w-5 accent-accent" />
        Can sign in
      </label>
    </ActionForm>
  );
}
