-- Website visitor intelligence: append-only events, anonymous writes, CMS-admin-only reads.
create table if not exists public.site_analytics_events (
  id bigint generated always as identity primary key,
  visitor_id uuid not null,
  event_type text not null check (event_type in ('page_view','heartbeat','page_exit','product_engaged','inquiry_view')),
  path text not null,
  page_title text,
  referrer_domain text,
  duration_seconds integer not null default 0 check (duration_seconds between 0 and 86400),
  country text,
  region text,
  city text,
  device_type text not null default 'unknown' check (device_type in ('desktop','mobile','tablet','unknown')),
  created_at timestamptz not null default now()
);
create index if not exists site_analytics_events_created_at_idx on public.site_analytics_events (created_at desc);
create index if not exists site_analytics_events_visitor_created_idx on public.site_analytics_events (visitor_id, created_at desc);
alter table public.site_analytics_events enable row level security;
revoke all on public.site_analytics_events from anon, authenticated;
grant insert on public.site_analytics_events to anon;
grant select on public.site_analytics_events to authenticated;
grant usage, select on sequence public.site_analytics_events_id_seq to anon;
drop policy if exists "Public can record website analytics" on public.site_analytics_events;
create policy "Public can record website analytics"
on public.site_analytics_events for insert to anon
with check (
  event_type in ('page_view','heartbeat','page_exit','product_engaged','inquiry_view')
  and length(path) between 1 and 500
  and path like '/%'
  and duration_seconds between 0 and 86400
  and (page_title is null or length(page_title) <= 300)
  and (country is null or length(country) <= 2)
  and (region is null or length(region) <= 100)
  and (city is null or length(city) <= 100)
  and device_type in ('desktop','mobile','tablet','unknown')
);
drop policy if exists "CMS admins can read website analytics" on public.site_analytics_events;
create policy "CMS admins can read website analytics"
on public.site_analytics_events for select to authenticated
using (public.is_cms_admin());
