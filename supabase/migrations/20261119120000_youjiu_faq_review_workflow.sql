-- YOUJIU FAQ knowledge base and human review workflow
create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  question text not null,
  answer text not null default '',
  category text not null default 'Purchasing',
  product_categories text[] not null default '{}',
  keywords text[] not null default '{}',
  locale text not null default 'en',
  status text not null default 'suggested' check (status in ('suggested','draft','published','archived')),
  sources jsonb not null default '[]'::jsonb,
  research_summary text,
  research_date date,
  ai_generated boolean not null default false,
  revision_of uuid references public.faqs(id) on delete set null,
  sort_order integer not null default 0,
  featured boolean not null default false,
  published_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists faqs_status_locale_order_idx on public.faqs (status, locale, sort_order, created_at desc);
create index if not exists faqs_category_status_idx on public.faqs (category, status);
create index if not exists faqs_revision_of_idx on public.faqs (revision_of);

alter table public.faqs enable row level security;

drop policy if exists "Published FAQs are visible publicly" on public.faqs;
create policy "Published FAQs are visible publicly"
  on public.faqs for select to anon, authenticated using (status = 'published');

drop policy if exists "CMS admins can read all FAQs" on public.faqs;
create policy "CMS admins can read all FAQs"
  on public.faqs for select to authenticated using ((select public.is_cms_admin()));

drop policy if exists "CMS admins can insert FAQs" on public.faqs;
create policy "CMS admins can insert FAQs"
  on public.faqs for insert to authenticated with check ((select public.is_cms_admin()));

drop policy if exists "CMS admins can update FAQs" on public.faqs;
create policy "CMS admins can update FAQs"
  on public.faqs for update to authenticated
  using ((select public.is_cms_admin()))
  with check ((select public.is_cms_admin()));

drop policy if exists "CMS admins can delete FAQs" on public.faqs;
create policy "CMS admins can delete FAQs"
  on public.faqs for delete to authenticated using ((select public.is_cms_admin()));

grant select on public.faqs to anon, authenticated;
grant insert, update, delete on public.faqs to authenticated;
grant all on public.faqs to service_role;
