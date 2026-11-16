"use client";

import { saveVendor } from "@/app/actions";
import { ActionForm } from "@/components/action-form";
import { inputCls, labelCls } from "@/components/styles";

type Vendor = { id: number; name: string; contactName: string; phone: string; email: string; notes: string; active: boolean };

export function VendorForm({ vendor }: { vendor?: Vendor }) {
  return (
    <ActionForm action={saveVendor} submitLabel={vendor ? "Save changes" : "Add vendor"} keepValues>
      {vendor && <input type="hidden" name="id" value={vendor.id} />}
      <div>
        <label htmlFor="name" className={labelCls}>Company name</label>
        <input id="name" name="name" required defaultValue={vendor?.name} className={inputCls} />
      </div>
      <div>
        <label htmlFor="contact_name" className={labelCls}>Contact person</label>
        <input id="contact_name" name="contact_name" defaultValue={vendor?.contactName} className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="phone" className={labelCls}>Phone</label>
          <input id="phone" name="phone" type="tel" defaultValue={vendor?.phone} className={inputCls} />
        </div>
        <div>
          <label htmlFor="email" className={labelCls}>Email</label>
          <input id="email" name="email" type="email" defaultValue={vendor?.email} className={inputCls} />
        </div>
      </div>
      <div>
        <label htmlFor="notes" className={labelCls}>Notes</label>
        <textarea id="notes" name="notes" rows={3} defaultValue={vendor?.notes} placeholder="Delivery days, minimum order, payment terms…" className={inputCls} />
      </div>
      {vendor && (
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input type="hidden" name="active_present" value="1" />
          <input type="checkbox" name="active" value="on" defaultChecked={vendor.active} className="h-5 w-5 accent-accent" />
          We still order from them
        </label>
      )}
    </ActionForm>
  );
}
