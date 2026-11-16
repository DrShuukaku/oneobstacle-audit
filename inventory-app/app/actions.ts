"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { createSession, destroySession, requireAdmin, requireUser } from "@/lib/auth";
import { fmtQty, UNITS } from "@/lib/format";
import { getOnHand } from "@/lib/queries";

export type FormState = { error?: string; ok?: string } | undefined;

const text = (fd: FormData, key: string, max = 500) => String(fd.get(key) ?? "").trim().slice(0, max);

function positive(value: unknown): number | null {
  const n = Number(String(value ?? "").trim());
  return Number.isFinite(n) && n > 0 && n < 1e8 ? Math.round(n * 1000) / 1000 : null;
}

function id(value: unknown): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function checkCredentials(username: string, password: string): string | null {
  if (!/^[a-z0-9._-]{2,30}$/.test(username)) return "Username must be 2-30 letters or numbers, with no spaces.";
  if (password.length < 6) return "Passcode must be at least 6 characters.";
  if (password.length > 100) return "Passcode is too long.";
  return null;
}

// ---------- Sign in ----------

export async function setup(_: FormState, fd: FormData): Promise<FormState> {
  const name = text(fd, "name", 60);
  const username = text(fd, "username", 30).toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (!name) return { error: "Enter your name." };
  const problem = checkCredentials(username, password);
  if (problem) return { error: problem };

  const hash = await bcrypt.hash(password, 10);
  // Only succeeds while there are no accounts at all.
  const rows = await sql<{ id: number }[]>`
    insert into users (username, name, password_hash, role)
    select ${username}, ${name}, ${hash}, 'admin'
    where not exists (select 1 from users)
    returning id`;
  if (!rows[0]) return { error: "Setup is already done. Please sign in." };
  await createSession(rows[0].id);
  redirect("/");
}

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const username = text(fd, "username", 30).toLowerCase();
  const password = String(fd.get("password") ?? "").slice(0, 100);
  const fail = { error: "Wrong username or passcode." };
  if (!username || !password) return fail;

  const rows = await sql<{ id: number; password_hash: string; locked_until: Date | null }[]>`
    select id, password_hash, locked_until from users where username = ${username} and active`;
  const user = rows[0];
  if (!user) {
    await bcrypt.compare(password, "$2b$10$0000000000000000000000000000000000000000000000000000");
    return fail;
  }
  if (user.locked_until && user.locked_until > new Date()) {
    return { error: "Too many wrong tries. Wait 15 minutes, or ask an admin to reset your passcode." };
  }
  if (!(await bcrypt.compare(password, user.password_hash))) {
    await sql`
      update users set
        failed_attempts = case when failed_attempts >= 4 then 0 else failed_attempts + 1 end,
        locked_until = case when failed_attempts >= 4 then now() + interval '15 minutes' else locked_until end
      where id = ${user.id}`;
    return fail;
  }
  await sql`update users set failed_attempts = 0, locked_until = null where id = ${user.id}`;
  await createSession(user.id);
  redirect("/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

// ---------- Items and vendors ----------

export async function saveItem(_: FormState, fd: FormData): Promise<FormState> {
  await requireUser();
  const itemId = id(fd.get("id"));
  const name = text(fd, "name", 80);
  const category = text(fd, "category", 40) || "Other";
  const unit = text(fd, "unit", 10);
  const notes = text(fd, "notes");
  const vendorId = id(fd.get("vendor_id"));
  const thresholdRaw = text(fd, "low_stock_threshold", 20);
  const threshold = thresholdRaw === "" ? null : Number(thresholdRaw);
  const active = !fd.has("active_present") || fd.get("active") === "on";

  if (!name) return { error: "Enter a name for the item." };
  if (!(UNITS as readonly string[]).includes(unit)) return { error: "Choose a unit." };
  if (threshold !== null && (!Number.isFinite(threshold) || threshold < 0)) {
    return { error: "The low-stock level must be a number, or left empty." };
  }

  let savedId: number;
  if (itemId) {
    await sql`
      update items set name = ${name}, category = ${category}, unit = ${unit}, notes = ${notes},
        vendor_id = ${vendorId}, low_stock_threshold = ${threshold}, active = ${active}
      where id = ${itemId}`;
    savedId = itemId;
  } else {
    const rows = await sql<{ id: number }[]>`
      insert into items (name, category, unit, notes, vendor_id, low_stock_threshold)
      values (${name}, ${category}, ${unit}, ${notes}, ${vendorId}, ${threshold}) returning id`;
    savedId = rows[0].id;
  }
  revalidatePath("/", "layout");
  redirect(`/items/${savedId}`);
}

export async function saveVendor(_: FormState, fd: FormData): Promise<FormState> {
  await requireUser();
  const vendorId = id(fd.get("id"));
  const name = text(fd, "name", 80);
  const contact = text(fd, "contact_name", 80);
  const phone = text(fd, "phone", 40);
  const email = text(fd, "email", 120);
  const notes = text(fd, "notes");
  const active = !fd.has("active_present") || fd.get("active") === "on";
  if (!name) return { error: "Enter the vendor's name." };

  let savedId: number;
  if (vendorId) {
    await sql`
      update vendors set name = ${name}, contact_name = ${contact}, phone = ${phone},
        email = ${email}, notes = ${notes}, active = ${active}
      where id = ${vendorId}`;
    savedId = vendorId;
  } else {
    const rows = await sql<{ id: number }[]>`
      insert into vendors (name, contact_name, phone, email, notes)
      values (${name}, ${contact}, ${phone}, ${email}, ${notes}) returning id`;
    savedId = rows[0].id;
  }
  revalidatePath("/", "layout");
  redirect(`/vendors/${savedId}`);
}

// ---------- Stock ----------

export async function receiveDelivery(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const vendorId = id(fd.get("vendor_id"));
  const receivedOn = text(fd, "received_on", 10);
  const invoice = text(fd, "invoice_number", 60);
  const note = text(fd, "note");
  if (!vendorId) return { error: "Choose the vendor." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(receivedOn)) return { error: "Choose the delivery date." };

  let raw: unknown;
  try {
    raw = JSON.parse(String(fd.get("lines") ?? "[]"));
  } catch {
    return { error: "Something went wrong reading the items. Please try again." };
  }
  if (!Array.isArray(raw)) return { error: "Add at least one item." };

  const lines: { itemId: number; qty: number; unitCost: number | null }[] = [];
  for (const line of raw as { itemId?: unknown; qty?: unknown; cost?: unknown }[]) {
    const blank = !line.itemId && !String(line.qty ?? "").trim() && !String(line.cost ?? "").trim();
    if (blank) continue;
    const itemId = id(line.itemId);
    const qty = positive(line.qty);
    if (!itemId) return { error: "Choose an item on every line (or remove the empty line)." };
    if (!qty) return { error: "Enter the weight or count for every item." };
    const costRaw = String(line.cost ?? "").trim();
    let unitCost: number | null = null;
    if (costRaw !== "") {
      const cost = Number(costRaw);
      if (!Number.isFinite(cost) || cost < 0) return { error: "Costs must be numbers." };
      unitCost = cost / qty;
    }
    lines.push({ itemId, qty, unitCost });
  }
  if (lines.length === 0) return { error: "Add at least one item." };

  await sql.begin(async (tx) => {
    const [delivery] = await tx<{ id: number }[]>`
      insert into deliveries (vendor_id, received_on, invoice_number, note, user_id)
      values (${vendorId}, ${receivedOn}, ${invoice}, ${note}, ${user.id}) returning id`;
    for (const line of lines) {
      await tx`
        insert into movements (item_id, type, quantity, unit_cost, delivery_id, user_id)
        values (${line.itemId}, 'receive', ${line.qty}, ${line.unitCost}, ${delivery.id}, ${user.id})`;
    }
  });
  revalidatePath("/", "layout");
  return { ok: `Delivery saved: ${lines.length} ${lines.length === 1 ? "item" : "items"} added to stock.` };
}

export async function recordUse(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const itemId = id(fd.get("item_id"));
  const qty = positive(fd.get("quantity"));
  const type = fd.get("type") === "waste" ? "waste" : "use";
  const note = text(fd, "note");
  if (!itemId) return { error: "Choose an item." };
  if (!qty) return { error: "Enter how much was used." };

  const [item] = await sql<{ name: string; unit: string }[]>`select name, unit from items where id = ${itemId}`;
  if (!item) return { error: "That item no longer exists." };
  const onHand = await getOnHand(itemId);
  if (qty > onHand) {
    return {
      error: `Only ${fmtQty(onHand, item.unit)} of ${item.name} is on record. If there is really more, open the item and correct the count first.`,
    };
  }
  await sql`
    insert into movements (item_id, type, quantity, note, user_id)
    values (${itemId}, ${type}, ${-qty}, ${note}, ${user.id})`;
  revalidatePath("/", "layout");
  return {
    ok: `${type === "waste" ? "Waste recorded" : "Deducted"}: ${fmtQty(qty, item.unit)} of ${item.name}. ${fmtQty(onHand - qty, item.unit)} left.`,
  };
}

/** Set stock to what was physically counted; records the difference. */
export async function recordCount(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const itemId = id(fd.get("item_id"));
  const raw = text(fd, "counted", 20);
  const counted = Number(raw);
  const note = text(fd, "note");
  if (!itemId) return { error: "Choose an item." };
  if (raw === "" || !Number.isFinite(counted) || counted < 0) return { error: "Enter the amount you counted." };

  const [item] = await sql<{ unit: string }[]>`select unit from items where id = ${itemId}`;
  if (!item) return { error: "That item no longer exists." };
  const onHand = await getOnHand(itemId);
  const delta = Math.round((counted - onHand) * 1000) / 1000;
  if (delta === 0) return { ok: "The count already matches. Nothing changed." };
  await sql`
    insert into movements (item_id, type, quantity, note, user_id)
    values (${itemId}, 'count', ${delta}, ${note}, ${user.id})`;
  revalidatePath("/", "layout");
  return { ok: `Stock set to ${fmtQty(counted, item.unit)} (was ${fmtQty(onHand, item.unit)}).` };
}

export async function deleteMovement(fd: FormData) {
  await requireAdmin();
  const movementId = id(fd.get("id"));
  if (!movementId) return;
  const [row] = await sql<{ delivery_id: number | null }[]>`
    delete from movements where id = ${movementId} returning delivery_id`;
  if (row?.delivery_id) {
    await sql`
      delete from deliveries d where d.id = ${row.delivery_id}
        and not exists (select 1 from movements m where m.delivery_id = d.id)`;
  }
  revalidatePath("/", "layout");
}

// ---------- Team ----------

export async function addUser(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const name = text(fd, "name", 60);
  const username = text(fd, "username", 30).toLowerCase();
  const password = String(fd.get("password") ?? "");
  const role = fd.get("role") === "admin" ? "admin" : "staff";
  if (!name) return { error: "Enter their name." };
  const problem = checkCredentials(username, password);
  if (problem) return { error: problem };
  const [taken] = await sql`select 1 from users where username = ${username}`;
  if (taken) return { error: "That username is already taken." };
  await sql`
    insert into users (username, name, password_hash, role)
    values (${username}, ${name}, ${await bcrypt.hash(password, 10)}, ${role})`;
  revalidatePath("/team");
  return { ok: `${name} can now sign in as "${username}".` };
}

export async function updateUser(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requireAdmin();
  const userId = id(fd.get("id"));
  if (!userId) return { error: "Unknown person." };
  const role = fd.get("role") === "admin" ? "admin" : "staff";
  const active = fd.get("active") === "on";
  const password = String(fd.get("password") ?? "");

  if (userId === me.id && (role !== "admin" || !active)) {
    return { error: "You can't remove your own admin access. Ask another admin to do it." };
  }
  if (password) {
    if (password.length < 6) return { error: "Passcode must be at least 6 characters." };
    if (password.length > 100) return { error: "Passcode is too long." };
    await sql`
      update users set password_hash = ${await bcrypt.hash(password, 10)}, failed_attempts = 0, locked_until = null
      where id = ${userId}`;
  }
  await sql`update users set role = ${role}, active = ${active} where id = ${userId}`;
  revalidatePath("/team");
  return { ok: password ? "Saved. The new passcode works right away." : "Saved." };
}
