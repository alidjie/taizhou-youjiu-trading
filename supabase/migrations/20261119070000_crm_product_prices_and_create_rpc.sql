-- Separate internal factory prices from the public website product catalog.
create table if not exists public.crm_product_prices (
  product_id text primary key references public.products(id) on delete cascade,
  factory_id uuid not null references public.crm_factories(id) on delete cascade,
  skd_price_usd numeric(16,4) check (skd_price_usd is null or skd_price_usd >= 0),
  skd_price_cny numeric(16,4) check (skd_price_cny is null or skd_price_cny >= 0),
  ckd_price_usd numeric(16,4) check (ckd_price_usd is null or ckd_price_usd >= 0),
  ckd_price_cny numeric(16,4) check (ckd_price_cny is null or ckd_price_cny >= 0),
  packing_quantity_40hq integer check (packing_quantity_40hq is null or packing_quantity_40hq > 0),
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists crm_product_prices_factory_idx on public.crm_product_prices(factory_id);
alter table public.crm_product_prices enable row level security;
create policy crm_product_prices_read on public.crm_product_prices for select to authenticated
using ((select private.crm_current_role()) in ('admin','sales') or factory_id=(select private.crm_current_factory_id()));
create policy crm_product_prices_admin_insert on public.crm_product_prices for insert to authenticated
with check ((select private.crm_current_role())='admin');
create policy crm_product_prices_admin_update on public.crm_product_prices for update to authenticated
using ((select private.crm_current_role())='admin') with check ((select private.crm_current_role())='admin');
create policy crm_product_prices_factory_insert on public.crm_product_prices for insert to authenticated
with check ((select private.crm_current_role())='factory' and factory_id=(select private.crm_current_factory_id()));
create policy crm_product_prices_factory_update on public.crm_product_prices for update to authenticated
using ((select private.crm_current_role())='factory' and factory_id=(select private.crm_current_factory_id()))
with check ((select private.crm_current_role())='factory' and factory_id=(select private.crm_current_factory_id()));
create policy crm_product_prices_admin_delete on public.crm_product_prices for delete to authenticated
using ((select private.crm_current_role())='admin');
create policy crm_product_prices_factory_delete on public.crm_product_prices for delete to authenticated
using ((select private.crm_current_role())='factory' and factory_id=(select private.crm_current_factory_id()));
grant select,insert,update,delete on public.crm_product_prices to authenticated;

create or replace function public.crm_create_product_with_prices(p_product jsonb,p_prices jsonb)
returns text language plpgsql security invoker set search_path=''
as $$
declare
 v_role text := (select private.crm_current_role());
 v_factory uuid := nullif(p_product->>'factory_id','')::uuid;
 v_id text := coalesce(nullif(p_product->>'id',''),replace(gen_random_uuid()::text,'-',''));
begin
 if v_role not in ('admin','factory') then raise exception 'Not authorized'; end if;
 if v_role='factory' and v_factory is distinct from (select private.crm_current_factory_id()) then raise exception 'Factory scope violation'; end if;
 if v_role='admin' and v_factory is null then raise exception 'Factory is required'; end if;
 if not exists(select 1 from public.crm_factories f where f.id=v_factory and f.status='active') then raise exception 'Active factory not found'; end if;
 insert into public.products(id,slug,name,category,model_code,factory_id,published,hero_image,image,gallery,specs,features,specifications,certifications,featured,sort_order,short_description,description,seo_title,seo_description,custom_attributes)
 values(v_id,p_product->>'slug',p_product->>'name',coalesce(p_product->>'category','electric-motorcycles'),nullif(p_product->>'model_code',''),v_factory,false,nullif(p_product->>'hero_image',''),nullif(p_product->>'image',''),
 coalesce(array(select jsonb_array_elements_text(coalesce(p_product->'gallery','[]'::jsonb))),array[]::text[]),coalesce(p_product->'specs','[]'::jsonb),coalesce(p_product->'features','[]'::jsonb),coalesce(p_product->'specifications','{}'::jsonb),
 coalesce(array(select jsonb_array_elements_text(coalesce(p_product->'certifications','[]'::jsonb))),array[]::text[]),coalesce((p_product->>'featured')::boolean,false),coalesce((p_product->>'sort_order')::integer,0),
 nullif(p_product->>'short_description',''),nullif(p_product->>'description',''),nullif(p_product->>'seo_title',''),nullif(p_product->>'seo_description',''),coalesce(p_product->'custom_attributes','{}'::jsonb));
 insert into public.crm_product_prices(product_id,factory_id,skd_price_usd,skd_price_cny,ckd_price_usd,ckd_price_cny,packing_quantity_40hq,updated_by)
 values(v_id,v_factory,nullif(p_prices->>'skd_price_usd','')::numeric,nullif(p_prices->>'skd_price_cny','')::numeric,nullif(p_prices->>'ckd_price_usd','')::numeric,nullif(p_prices->>'ckd_price_cny','')::numeric,nullif(p_prices->>'packing_quantity_40hq','')::integer,(select auth.uid()));
 return v_id;
end; $$;
grant execute on function public.crm_create_product_with_prices(jsonb,jsonb) to authenticated;
