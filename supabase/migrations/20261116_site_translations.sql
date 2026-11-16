-- YOUJIU multilingual translation workflow
-- Run once in Supabase SQL Editor. Existing English content remains the source of truth.

create table if not exists public.site_translations (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('site_content','product','category')),
  entity_id text not null,
  locale text not null check (locale in ('fr','de','es','ar','ru','pt')),
  source_content jsonb not null default '{}'::jsonb,
  translated_content jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft','published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  unique(entity_type, entity_id, locale)
);

create index if not exists site_translations_public_lookup
  on public.site_translations(entity_type, entity_id, locale, status);

alter table public.site_translations enable row level security;

drop policy if exists "Published translations are publicly readable" on public.site_translations;
drop policy if exists "CMS admins manage translations" on public.site_translations;
create policy "Read published translations or own CMS drafts"
  on public.site_translations for select to anon, authenticated
  using (
    status = 'published'
    or exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid()))
  );
create policy "CMS admins insert translations"
  on public.site_translations for insert to authenticated
  with check (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())));
create policy "CMS admins update translations"
  on public.site_translations for update to authenticated
  using (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())));
create policy "CMS admins delete translations"
  on public.site_translations for delete to authenticated
  using (exists (select 1 from public.cms_admins a where a.user_id = (select auth.uid())));

grant select on public.site_translations to anon, authenticated;
grant insert, update, delete on public.site_translations to authenticated;
