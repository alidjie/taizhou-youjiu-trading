-- YOUJIU Blog CMS
-- Extends the existing legacy blog_posts table without dropping existing columns or content.

alter table public.blog_posts
  add column if not exists status text not null default 'draft',
  add column if not exists cover_image text,
  add column if not exists tags text[] not null default '{}',
  add column if not exists featured boolean not null default false,
  add column if not exists published_at timestamptz,
  add column if not exists seo_title text,
  add column if not exists seo_description text;

update public.blog_posts
set cover_image = coalesce(cover_image, image),
    published_at = coalesce(published_at, date::timestamptz)
where cover_image is null or published_at is null;

alter table public.blog_posts drop constraint if exists blog_posts_status_check;
alter table public.blog_posts add constraint blog_posts_status_check
  check (status in ('draft','published'));

create index if not exists blog_posts_public_listing
  on public.blog_posts(status, published_at desc, created_at desc);
create index if not exists blog_posts_category_listing
  on public.blog_posts(category, status, published_at desc);

alter table public.blog_posts enable row level security;
drop policy if exists "Public can read blog_posts" on public.blog_posts;
drop policy if exists "Public can read published blog posts" on public.blog_posts;
drop policy if exists "CMS admins read all blog posts" on public.blog_posts;
drop policy if exists "CMS admins insert blog posts" on public.blog_posts;
drop policy if exists "CMS admins update blog posts" on public.blog_posts;
drop policy if exists "CMS admins delete blog posts" on public.blog_posts;

create policy "Public can read published blog posts"
  on public.blog_posts for select to anon, authenticated
  using (status = 'published');
create policy "CMS admins read all blog posts"
  on public.blog_posts for select to authenticated
  using (public.is_cms_admin());
create policy "CMS admins insert blog posts"
  on public.blog_posts for insert to authenticated
  with check (public.is_cms_admin());
create policy "CMS admins update blog posts"
  on public.blog_posts for update to authenticated
  using (public.is_cms_admin())
  with check (public.is_cms_admin());
create policy "CMS admins delete blog posts"
  on public.blog_posts for delete to authenticated
  using (public.is_cms_admin());

grant select on public.blog_posts to anon, authenticated;
grant insert, update, delete on public.blog_posts to authenticated;

do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.site_translations'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%entity_type%'
  loop
    execute format('alter table public.site_translations drop constraint %I', c.conname);
  end loop;
end $$;
alter table public.site_translations add constraint site_translations_entity_type_check
  check (entity_type in ('site_content','product','category','blog'));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('blog-images', 'blog-images', true, 12582912, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set public = true, file_size_limit = 12582912,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read blog images" on storage.objects;
drop policy if exists "CMS admins upload blog images" on storage.objects;
drop policy if exists "CMS admins update blog images" on storage.objects;
drop policy if exists "CMS admins delete blog images" on storage.objects;

create policy "Public can read blog images"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'blog-images');
create policy "CMS admins upload blog images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'blog-images' and public.is_cms_admin());
create policy "CMS admins update blog images"
  on storage.objects for update to authenticated
  using (bucket_id = 'blog-images' and public.is_cms_admin())
  with check (bucket_id = 'blog-images' and public.is_cms_admin());
create policy "CMS admins delete blog images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'blog-images' and public.is_cms_admin());
