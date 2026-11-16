import "server-only";
import { sql } from "./db";

export type StockRow = {
  id: number;
  name: string;
  category: string;
  unit: string;
  low_stock_threshold: string | null;
  vendor_id: number | null;
  vendor_name: string | null;
  notes: string;
  active: boolean;
  on_hand: string;
  last_cost: string | null;
  is_low: boolean;
};

/** Every item with its current stock, last purchase price and low-stock flag. */
export async function getStock(opts: { includeInactive?: boolean; id?: number } = {}) {
  return sql<StockRow[]>`
    select i.id, i.name, i.category, i.unit, i.low_stock_threshold, i.vendor_id, i.notes, i.active,
           v.name as vendor_name,
           coalesce(s.on_hand, 0) as on_hand,
           c.unit_cost as last_cost,
           (i.low_stock_threshold is not null and coalesce(s.on_hand, 0) <= i.low_stock_threshold) as is_low
    from items i
    left join vendors v on v.id = i.vendor_id
    left join (select item_id, sum(quantity) as on_hand from movements group by item_id) s on s.item_id = i.id
    left join lateral (
      select unit_cost from movements
      where item_id = i.id and type = 'receive' and unit_cost is not null
      order by created_at desc limit 1
    ) c on true
    where ${opts.includeInactive ? sql`true` : sql`i.active`}
      and ${opts.id ? sql`i.id = ${opts.id}` : sql`true`}
    order by i.category, lower(i.name)`;
}

export async function getOnHand(itemId: number): Promise<number> {
  const rows = await sql<{ on_hand: string }[]>`
    select coalesce(sum(quantity), 0) as on_hand from movements where item_id = ${itemId}`;
  return Number(rows[0].on_hand);
}

export type MovementRow = {
  id: number;
  item_id: number;
  item_name: string;
  unit: string;
  type: string;
  quantity: string;
  unit_cost: string | null;
  note: string;
  user_name: string;
  vendor_name: string | null;
  created_at: Date;
};

export async function getMovements(opts: { itemId?: number; type?: string; limit?: number; offset?: number } = {}) {
  return sql<MovementRow[]>`
    select m.id, m.item_id, i.name as item_name, i.unit, m.type, m.quantity, m.unit_cost, m.note,
           u.name as user_name, v.name as vendor_name, m.created_at
    from movements m
    join items i on i.id = m.item_id
    join users u on u.id = m.user_id
    left join deliveries d on d.id = m.delivery_id
    left join vendors v on v.id = d.vendor_id
    where ${opts.itemId ? sql`m.item_id = ${opts.itemId}` : sql`true`}
      and ${opts.type ? sql`m.type = ${opts.type}` : sql`true`}
    order by m.created_at desc, m.id desc
    limit ${opts.limit ?? 50} offset ${opts.offset ?? 0}`;
}

export type VendorRow = {
  id: number;
  name: string;
  contact_name: string;
  phone: string;
  email: string;
  notes: string;
  active: boolean;
  delivery_count: number;
  last_delivery: string | null;
  spend_30d: string;
};

export async function getVendors(opts: { includeInactive?: boolean; id?: number } = {}) {
  return sql<VendorRow[]>`
    select v.id, v.name, v.contact_name, v.phone, v.email, v.notes, v.active,
           (select count(*)::int from deliveries d where d.vendor_id = v.id) as delivery_count,
           (select to_char(max(received_on), 'YYYY-MM-DD') from deliveries d where d.vendor_id = v.id) as last_delivery,
           coalesce((
             select sum(m.quantity * m.unit_cost) from movements m
             join deliveries d on d.id = m.delivery_id
             where d.vendor_id = v.id and d.received_on >= current_date - 30
           ), 0) as spend_30d
    from vendors v
    where ${opts.includeInactive ? sql`true` : sql`v.active`}
      and ${opts.id ? sql`v.id = ${opts.id}` : sql`true`}
    order by lower(v.name)`;
}

export type DeliveryRow = {
  id: number;
  vendor_id: number;
  vendor_name: string;
  received_on: string;
  invoice_number: string;
  note: string;
  user_name: string;
  total: string;
  summary: string;
};

export async function getDeliveries(opts: { vendorId?: number; limit?: number } = {}) {
  return sql<DeliveryRow[]>`
    select d.id, d.vendor_id, v.name as vendor_name, to_char(d.received_on, 'YYYY-MM-DD') as received_on,
           d.invoice_number, d.note, u.name as user_name,
           coalesce(sum(m.quantity * m.unit_cost), 0) as total,
           coalesce(string_agg(trim(to_char(m.quantity, 'FM999999990.###'), '.') || ' ' || i.unit || ' ' || i.name, ', ' order by m.id), '') as summary
    from deliveries d
    join vendors v on v.id = d.vendor_id
    join users u on u.id = d.user_id
    left join movements m on m.delivery_id = d.id
    left join items i on i.id = m.item_id
    where ${opts.vendorId ? sql`d.vendor_id = ${opts.vendorId}` : sql`true`}
    group by d.id, v.name, u.name
    order by d.received_on desc, d.id desc
    limit ${opts.limit ?? 20}`;
}

export async function getSpendByVendor(days: number) {
  return sql<{ vendor_id: number; vendor_name: string; total: string; deliveries: number }[]>`
    select v.id as vendor_id, v.name as vendor_name,
           sum(m.quantity * m.unit_cost) as total, count(distinct d.id)::int as deliveries
    from deliveries d
    join vendors v on v.id = d.vendor_id
    join movements m on m.delivery_id = d.id
    where d.received_on > current_date - ${days}::int and m.unit_cost is not null
    group by v.id, v.name
    having sum(m.quantity * m.unit_cost) > 0
    order by total desc`;
}

/** What a vendor has supplied: each item with its latest and previous price. */
export async function getVendorItems(vendorId: number) {
  return sql<{ item_id: number; name: string; unit: string; last_cost: string | null; prev_cost: string | null; last_on: string; total_qty: string }[]>`
    with r as (
      select m.item_id, m.unit_cost, m.quantity, d.received_on,
             row_number() over (partition by m.item_id order by d.received_on desc, m.id desc) as rn
      from movements m join deliveries d on d.id = m.delivery_id
      where d.vendor_id = ${vendorId}
    )
    select i.id as item_id, i.name, i.unit,
           max(r.unit_cost) filter (where r.rn = 1) as last_cost,
           max(r.unit_cost) filter (where r.rn = 2) as prev_cost,
           to_char(max(r.received_on), 'YYYY-MM-DD') as last_on,
           sum(r.quantity) as total_qty
    from r join items i on i.id = r.item_id
    group by i.id, i.name, i.unit
    order by lower(i.name)`;
}
