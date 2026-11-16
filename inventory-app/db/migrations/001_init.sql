create table users (
  id serial primary key,
  username text not null unique,
  name text not null,
  password_hash text not null,
  role text not null default 'staff' check (role in ('staff', 'admin')),
  active boolean not null default true,
  failed_attempts integer not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now()
);

create table vendors (
  id serial primary key,
  name text not null,
  contact_name text not null default '',
  phone text not null default '',
  email text not null default '',
  notes text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table items (
  id serial primary key,
  name text not null,
  category text not null default 'Other',
  unit text not null default 'lb',
  low_stock_threshold numeric(12, 3),
  vendor_id integer references vendors (id) on delete set null,
  notes text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table deliveries (
  id serial primary key,
  vendor_id integer not null references vendors (id),
  received_on date not null,
  invoice_number text not null default '',
  note text not null default '',
  user_id integer not null references users (id),
  created_at timestamptz not null default now()
);

-- Every change to stock is one row. Stock on hand = sum(quantity) per item.
-- quantity is signed: positive adds stock, negative removes it.
create table movements (
  id serial primary key,
  item_id integer not null references items (id),
  type text not null check (type in ('receive', 'use', 'waste', 'count')),
  quantity numeric(12, 3) not null,
  unit_cost numeric(12, 4),
  delivery_id integer references deliveries (id) on delete cascade,
  note text not null default '',
  user_id integer not null references users (id),
  created_at timestamptz not null default now()
);

create index movements_item_idx on movements (item_id, created_at desc);
create index movements_created_idx on movements (created_at desc);
create index movements_delivery_idx on movements (delivery_id);
create index deliveries_vendor_idx on deliveries (vendor_id, received_on desc);
