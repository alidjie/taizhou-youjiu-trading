
create table if not exists public.product_website_content (
  product_id text primary key references public.products(id) on delete cascade,
  draft_content jsonb not null default '{"schema_version":1,"marketing_blocks":[]}'::jsonb,
  published_content jsonb,
  is_published boolean not null default false,
  draft_updated_at timestamptz not null default now(),
  published_at timestamptz,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.product_website_content enable row level security;
grant select on public.product_website_content to anon, authenticated;
grant insert, update, delete on public.product_website_content to authenticated;

drop policy if exists "Public can read published website product content" on public.product_website_content;
create policy "Public can read published website product content"
  on public.product_website_content for select to anon using (is_published = true);

drop policy if exists "CRM can read product website content" on public.product_website_content;
create policy "CRM can read product website content"
  on public.product_website_content for select to authenticated
  using (
    (select private.crm_current_role()) in ('admin','sales')
    or (
      (select private.crm_current_role()) = 'factory'
      and exists (
        select 1 from public.products p
        where p.id = product_website_content.product_id
          and p.factory_id = (select private.crm_current_factory_id())
      )
    )
  );

drop policy if exists "CRM can insert product website drafts" on public.product_website_content;
create policy "CRM can insert product website drafts"
  on public.product_website_content for insert to authenticated
  with check (
    (select private.crm_current_role()) = 'admin'
    or (
      (select private.crm_current_role()) = 'factory'
      and exists (
        select 1 from public.products p
        where p.id = product_website_content.product_id
          and p.factory_id = (select private.crm_current_factory_id())
      )
    )
  );

drop policy if exists "CRM can update product website drafts" on public.product_website_content;
create policy "CRM can update product website drafts"
  on public.product_website_content for update to authenticated
  using (
    (select private.crm_current_role()) = 'admin'
    or (
      (select private.crm_current_role()) = 'factory'
      and exists (
        select 1 from public.products p
        where p.id = product_website_content.product_id
          and p.factory_id = (select private.crm_current_factory_id())
      )
    )
  )
  with check (
    (select private.crm_current_role()) = 'admin'
    or (
      (select private.crm_current_role()) = 'factory'
      and exists (
        select 1 from public.products p
        where p.id = product_website_content.product_id
          and p.factory_id = (select private.crm_current_factory_id())
      )
    )
  );

drop policy if exists "CRM can delete product website drafts" on public.product_website_content;
create policy "CRM can delete product website drafts"
  on public.product_website_content for delete to authenticated
  using (
    (select private.crm_current_role()) = 'admin'
    or (
      (select private.crm_current_role()) = 'factory'
      and exists (
        select 1 from public.products p
        where p.id = product_website_content.product_id
          and p.factory_id = (select private.crm_current_factory_id())
      )
    )
  );

create or replace function private.crm_guard_product_website_publication()
returns trigger language plpgsql set search_path = ''
as $function$
begin
  if tg_op = 'INSERT' then
    if (new.is_published or new.published_content is not null or new.published_at is not null)
       and (select private.crm_current_role()) is distinct from 'admin' then
      raise exception 'Only CRM administrators may publish website product content';
    end if;
  elsif
    (new.is_published is distinct from old.is_published
      or new.published_content is distinct from old.published_content
      or new.published_at is distinct from old.published_at)
    and (select private.crm_current_role()) is distinct from 'admin' then
      raise exception 'Only CRM administrators may change published website content';
  end if;
  return new;
end;
$function$;

drop trigger if exists crm_product_website_publication_guard on public.product_website_content;
create trigger crm_product_website_publication_guard
  before insert or update of is_published, published_content, published_at
  on public.product_website_content for each row
  execute function private.crm_guard_product_website_publication();

create or replace function public.crm_save_product_website_draft(p_product_id text, p_marketing_blocks jsonb default '[]'::jsonb)
returns jsonb language plpgsql security invoker set search_path = ''
as $function$
declare
  v_role text := (select private.crm_current_role());
  v_factory uuid := (select private.crm_current_factory_id());
  v_product public.products%rowtype;
  v_content jsonb;
begin
  if v_role not in ('admin','factory') then
    raise exception 'Only CRM administrators or factory users may save product website drafts';
  end if;
  if jsonb_typeof(coalesce(p_marketing_blocks, '[]'::jsonb)) <> 'array' then
    raise exception 'Marketing blocks must be a JSON array';
  end if;
  select * into v_product from public.products p where p.id = p_product_id;
  if not found then raise exception 'Product not found'; end if;
  if v_role = 'factory' and v_product.factory_id is distinct from v_factory then
    raise exception 'Factory scope violation';
  end if;

  v_content := jsonb_build_object(
    'schema_version', 1, 'product_id', v_product.id, 'slug', v_product.slug,
    'name', v_product.name, 'model_code', v_product.model_code, 'category', v_product.category,
    'image', v_product.image, 'hero_image', v_product.hero_image, 'gallery', to_jsonb(v_product.gallery),
    'short_description', v_product.short_description, 'description', v_product.description,
    'specs', coalesce(v_product.specs, '[]'::jsonb), 'features', coalesce(v_product.features, '[]'::jsonb),
    'specifications', coalesce(v_product.specifications, '{}'::jsonb),
    'certifications', to_jsonb(v_product.certifications), 'featured', coalesce(v_product.featured, false),
    'published', false, 'sort_order', coalesce(v_product.sort_order, 0),
    'seo_title', v_product.seo_title, 'seo_description', v_product.seo_description,
    'marketing_blocks', coalesce(p_marketing_blocks, '[]'::jsonb)
  );

  insert into public.product_website_content(product_id, draft_content, updated_by)
  values (v_product.id, v_content, (select auth.uid()))
  on conflict (product_id) do update
    set draft_content = excluded.draft_content, draft_updated_at = now(), updated_by = excluded.updated_by;

  return jsonb_build_object('product_id', v_product.id, 'draft_updated_at', now());
end;
$function$;

create or replace function public.crm_publish_product_website_content(p_product_id text)
returns jsonb language plpgsql security invoker set search_path = ''
as $function$
declare v_role text := (select private.crm_current_role()); v_draft jsonb;
begin
  if v_role is distinct from 'admin' then raise exception 'Only CRM administrators may publish products to the website'; end if;
  select draft_content into v_draft from public.product_website_content where product_id = p_product_id for update;
  if v_draft is null then raise exception 'Please save the product website draft before publishing'; end if;
  if coalesce(v_draft->>'name','') = '' or coalesce(v_draft->>'slug','') = ''
    or coalesce(v_draft->>'category','') = ''
    or coalesce(v_draft->>'hero_image', v_draft->>'image','') = ''
    or coalesce(v_draft->>'short_description','') = ''
    or jsonb_typeof(coalesce(v_draft->'specifications','{}'::jsonb)) <> 'object'
    or not exists (select 1 from jsonb_each(coalesce(v_draft->'specifications','{}'::jsonb))) then
    raise exception 'Product is incomplete: name, URL slug, category, main image, short introduction and technical specifications are required';
  end if;
  update public.product_website_content
    set published_content = v_draft, is_published = true, published_at = now()
    where product_id = p_product_id;
  update public.products set published = true, updated_at = now() where id = p_product_id;
  return jsonb_build_object('product_id', p_product_id, 'published', true, 'published_at', now());
end;
$function$;

create or replace function public.crm_unpublish_product_website_content(p_product_id text)
returns jsonb language plpgsql security invoker set search_path = ''
as $function$
declare v_role text := (select private.crm_current_role());
begin
  if v_role is distinct from 'admin' then raise exception 'Only CRM administrators may withdraw products from the website'; end if;
  update public.product_website_content set is_published = false where product_id = p_product_id;
  update public.products set published = false, updated_at = now() where id = p_product_id;
  if not found then raise exception 'Product not found'; end if;
  return jsonb_build_object('product_id', p_product_id, 'published', false);
end;
$function$;

revoke all on function public.crm_save_product_website_draft(text,jsonb) from public, anon;
revoke all on function public.crm_publish_product_website_content(text) from public, anon;
revoke all on function public.crm_unpublish_product_website_content(text) from public, anon;
grant execute on function public.crm_save_product_website_draft(text,jsonb) to authenticated;
grant execute on function public.crm_publish_product_website_content(text) to authenticated;
grant execute on function public.crm_unpublish_product_website_content(text) to authenticated;

create or replace view public.website_products with (security_invoker = true) as
select
  c.product_id as id, c.published_content->>'slug' as slug,
  c.published_content->>'name' as name, c.published_content->>'model_code' as model_code,
  c.published_content->>'category' as category, c.published_content->>'image' as image,
  c.published_content->>'hero_image' as hero_image,
  array(select jsonb_array_elements_text(coalesce(c.published_content->'gallery','[]'::jsonb))) as gallery,
  c.published_content->>'short_description' as short_description,
  c.published_content->>'description' as description,
  coalesce(c.published_content->'specs','[]'::jsonb) as specs,
  coalesce(c.published_content->'features','[]'::jsonb) as features,
  coalesce(c.published_content->'specifications','{}'::jsonb) as specifications,
  array(select jsonb_array_elements_text(coalesce(c.published_content->'certifications','[]'::jsonb))) as certifications,
  coalesce((c.published_content->>'featured')::boolean,false) as featured,
  true as published, coalesce((c.published_content->>'sort_order')::integer,0) as sort_order,
  c.published_content->>'seo_title' as seo_title,
  c.published_content->>'seo_description' as seo_description,
  p.created_at as created_at, c.published_at as updated_at,
  c.published_content->'marketing_blocks' as marketing_blocks
from public.product_website_content c
join public.products p on p.id = c.product_id
where c.is_published = true and p.published = true;

grant select on public.website_products to anon, authenticated;
