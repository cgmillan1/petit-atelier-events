-- Petit Atelier Events · Supabase schema
-- Run once in Supabase > SQL Editor. Then: Authentication > disable sign-ups, create Karol's user,
-- and add her email to public.admins (last line of this file).

create table if not exists public.admins (email text primary key);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where email = lower(auth.jwt() ->> 'email'));
$$;

create table if not exists public.assets (
  id text primary key,
  data jsonb not null,               -- name, es, cat, art, price, qty, repl, layer, x, y, s, desc, desc_es, made, label
  active boolean not null default true,
  photo text default '',
  sort int default 0
);

create table if not exists public.settings (
  id int primary key default 1 check (id = 1),
  data jsonb not null default '{}'
);

create table if not exists public.bookings (
  code text primary key,
  created_at timestamptz not null default now(),
  status text not null default 'new' check (status in ('new','confirmed','ready','delivered','returned','closed','declined','cancelled')),
  event_date date not null,
  email text not null,
  data jsonb not null
);
create index if not exists bookings_event_date on public.bookings (event_date);

alter table public.admins   enable row level security;
alter table public.assets   enable row level security;
alter table public.settings enable row level security;
alter table public.bookings enable row level security;

-- Public can read the catalog and settings; only Karol edits them.
create policy "catalog read"   on public.assets   for select using (active or public.is_admin());
create policy "catalog admin"  on public.assets   for all    using (public.is_admin()) with check (public.is_admin());
create policy "settings read"  on public.settings for select using (true);
create policy "settings admin" on public.settings for all    using (public.is_admin()) with check (public.is_admin());
-- Bookings: no direct public access at all. Customers go through the functions below.
create policy "bookings admin" on public.bookings for all    using (public.is_admin()) with check (public.is_admin());
create policy "admins self"    on public.admins   for select using (public.is_admin());

-- How many of each piece are held around a date (no customer details leave the database).
create or replace function public.reserved_on(d date, buf int default 1)
returns table (asset_id text, qty int)
language sql stable security definer set search_path = public as $$
  select it ->> 'id', sum((it ->> 'qty')::int)::int
  from public.bookings b, jsonb_array_elements(b.data -> 'items') it
  where b.status not in ('declined','cancelled')
    and abs(b.event_date - d) <= greatest(0, least(buf, 3))
  group by 1;
$$;

-- Balloon builder price (same formula as the website; rates live in settings.balloon so Karol can change them)
create or replace function public.balloon_price(cfg jsonb, s jsonb)
returns numeric language plpgsql immutable as $$
declare
  r jsonb := '{"classic":16,"organic":22,"full":30,"column":18,"cluster":35,"extraColor":15,"chrome":3,"greenery":4,"confetti":2,"statement":12,"foil":25,"frame":40,"minFt":4,"includedColors":3,"maxColors":6,"strandFactor":0.85}'::jsonb || coalesce(s -> 'balloon', '{}'::jsonb);
  kind text := coalesce(cfg ->> 'kind', 'organic');
  ft numeric; strands int; sf numeric; lf numeric; total numeric := 0; ncol int;
begin
  if kind not in ('classic','organic','full','column','cluster') then kind := 'organic'; end if;
  ft := case when kind = 'cluster' then 0 else greatest((r->>'minFt')::numeric, least(60, round(coalesce((cfg->>'ft')::numeric, 10)))) end;
  strands := case when kind in ('column','cluster') then 1 else greatest(1, least(3, coalesce((cfg->>'strands')::int, 1))) end;
  sf := 1 + (strands - 1) * (r->>'strandFactor')::numeric;
  if kind = 'cluster' then total := greatest(1, least(12, coalesce((cfg->>'count')::int, 3))) * (r->>'cluster')::numeric;
  else total := round(ft * (r->>kind)::numeric * sf); end if;
  ncol := least((r->>'maxColors')::int, jsonb_array_length(coalesce(cfg->'colors', '[]'::jsonb)));
  total := total + greatest(0, ncol - (r->>'includedColors')::int) * (r->>'extraColor')::numeric;
  lf := case when kind = 'cluster' then 0 else ft * sf end;
  if coalesce((cfg->>'chrome')::boolean, false)   then total := total + round(lf * (r->>'chrome')::numeric); end if;
  if coalesce((cfg->>'greenery')::boolean, false) then total := total + round(lf * (r->>'greenery')::numeric); end if;
  if coalesce((cfg->>'confetti')::boolean, false) then total := total + round(lf * (r->>'confetti')::numeric); end if;
  total := total + greatest(0, least(6, coalesce((cfg->>'statement')::int, 0))) * (r->>'statement')::numeric;
  total := total + greatest(0, least(4, coalesce((cfg->>'foils')::int, 0))) * (r->>'foil')::numeric;
  if cfg->>'around' = 'doorway' and kind not in ('column','cluster') then total := total + (r->>'frame')::numeric; end if;
  return total;
end $$;

-- Creates a request. Prices, fees and availability are re-checked on the server so totals can't be tampered with.
create or replace function public.create_booking(payload jsonb)
returns text language plpgsql security definer set search_path = public as $$
declare
  s jsonb := coalesce((select data from public.settings where id = 1), '{}');
  d date := (payload -> 'event' ->> 'date')::date;
  it jsonb; a record; held int; items jsonb := '[]'; sub numeric := 0;
  disc numeric; inst numeric; care numeric; secdep numeric; total numeric; v_code text; bcfg jsonb; bp numeric;
begin
  if d < current_date + 2 then raise exception 'Please book at least 2 days ahead'; end if;
  if coalesce(payload -> 'customer' ->> 'email', '') !~ '^\S+@\S+\.\S+$' then raise exception 'Valid email required'; end if;
  if jsonb_array_length(coalesce(payload -> 'items', '[]')) = 0 then raise exception 'Your setup is empty'; end if;

  perform pg_advisory_xact_lock(hashtext(d::text));   -- one booking at a time per date
  for it in select * from jsonb_array_elements(payload -> 'items') loop
    select id, data, active into a from public.assets where id = it ->> 'id';
    if not found or not a.active then raise exception 'Piece % is not available', it ->> 'id'; end if;
    select coalesce(r.qty, 0) into held from public.reserved_on(d, coalesce((s ->> 'bufferDays')::int, 1)) r where r.asset_id = a.id;
    if not coalesce((a.data ->> 'made')::boolean, false) and coalesce(held, 0) + (it ->> 'qty')::int > (a.data ->> 'qty')::int then
      raise exception '% was just booked for that date', a.data ->> 'name'; end if;
    if coalesce((a.data ->> 'perFt')::boolean, false) then   -- balloons: built to order, priced by the balloon builder formula
      bcfg := coalesce(it -> 'cfg', jsonb_build_object('kind', 'organic', 'ft', coalesce((it ->> 'ft')::int, 10), 'colors', '[]'::jsonb));
      bp := public.balloon_price(bcfg, s);
      items := items || jsonb_build_object('id', a.id, 'qty', 1, 'ft', coalesce((bcfg ->> 'ft')::int, 0), 'price', bp, 'cfg', bcfg,
        'name', 'Balloons: ' || coalesce(it ->> 'name', bcfg ->> 'kind'));
      sub := sub + bp;
    else
      items := items || jsonb_build_object('id', a.id, 'qty', (it ->> 'qty')::int, 'price', (a.data ->> 'price')::numeric, 'name', a.data ->> 'name');
      sub := sub + (a.data ->> 'price')::numeric * (it ->> 'qty')::int;
    end if;
  end loop;

  disc  := least(greatest(coalesce((payload -> 'totals' ->> 'discount')::numeric, 0), 0), round(sub * 0.2));
  inst  := case when payload -> 'event' ->> 'fulfillment' = 'install' then coalesce((s ->> 'installFee')::numeric, 120) else 0 end;
  care  := case when payload ->> 'protection' = 'care' then coalesce((s ->> 'carePlan')::numeric, 100) else 0 end;
  secdep:= case when payload ->> 'protection' = 'care' then 0 else coalesce((s ->> 'securityDeposit')::numeric, 150) end;
  total := sub - disc + inst + care;
  if sub - disc < coalesce((s ->> 'minOrder')::numeric, 0) then raise exception 'Below the minimum order'; end if;

  loop
    v_code := 'PA-' || upper(substr(translate(md5(random()::text || clock_timestamp()::text), '01', 'XY'), 1, 5));
    exit when not exists (select 1 from public.bookings b where b.code = v_code);
  end loop;

  payload := payload || jsonb_build_object('code', v_code, 'status', 'new', 'created_at', now(), 'items', items, 'sample', false,
    'payments', jsonb_build_object('retainer', false, 'balance', false, 'depositReturned', false), 'reminders', '[]'::jsonb, 'prep', '{}'::jsonb,
    'totals', jsonb_build_object('subtotal', sub, 'discount', disc, 'install', inst, 'care', care, 'securityDeposit', secdep,
      'total', total, 'retainer', round(total * coalesce((s ->> 'depositPct')::numeric, 30) / 100), 'pkg', payload -> 'totals' ->> 'pkg'));
  insert into public.bookings (code, status, event_date, email, data)
  values (v_code, 'new', d, lower(payload -> 'customer' ->> 'email'), payload);
  return v_code;
end $$;

-- Customer lookup by code + email
create or replace function public.lookup_booking(c text, e text)
returns jsonb language sql stable security definer set search_path = public as $$
  select data from public.bookings where code = upper(trim(c)) and email = lower(trim(e)) limit 1;
$$;

grant execute on function public.reserved_on(date, int)   to anon, authenticated;
grant execute on function public.create_booking(jsonb)    to anon, authenticated;
grant execute on function public.lookup_booking(text, text) to anon, authenticated;

-- Photos bucket (public read, Karol writes)
insert into storage.buckets (id, name, public) values ('photos', 'photos', true) on conflict do nothing;
create policy "photos read"  on storage.objects for select using (bucket_id = 'photos');
create policy "photos admin" on storage.objects for all using (bucket_id = 'photos' and public.is_admin()) with check (bucket_id = 'photos' and public.is_admin());

-- Karol's login email (must match the user you create in Authentication)
insert into public.admins (email) values ('askpetitatelier@gmail.com') on conflict do nothing;

-- AI balloon designer: per-visitor daily limits (only the ai-balloons function touches this) and the previews bucket
create table if not exists public.ai_usage (ip text not null, day date not null, mode text not null, n int not null default 0, primary key (ip, day, mode));
alter table public.ai_usage enable row level security;   -- no policies: only the service role can read or write
insert into storage.buckets (id, name, public) values ('ai', 'ai', true) on conflict do nothing;
create policy "ai previews read" on storage.objects for select using (bucket_id = 'ai');
