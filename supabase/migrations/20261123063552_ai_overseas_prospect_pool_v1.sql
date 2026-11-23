-- AI overseas prospect pool, CRM duplicate matching, customer intelligence alerts and claim leases.
-- Applied to Supabase project fsqpeuulaglnnwfyxndj.

create table if not exists public.ai_prospect_leads (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  normalized_company_name text not null,
  country text not null,
  city text,
  website text,
  domain text,
  company_type text not null default 'unknown',
  product_categories text[] not null default '{}',
  company_profile text,
  estimated_scale text,
  import_evidence text,
  contacts jsonb not null default '[]'::jsonb,
  source_urls jsonb not null default '[]'::jsonb,
  qualification_score integer not null default 0 check (qualification_score between 0 and 100),
  qualification_notes text,
  discovered_at timestamptz not null default now(),
  last_verified_at timestamptz,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  status text not null default 'pool' check (status in ('pool','claimed','converted','rejected','matched_customer')),
  claimed_by uuid references auth.users(id) on delete set null,
  claimed_at timestamptz,
  claim_expires_at timestamptz,
  matched_customer_id uuid references public.crm_customers(id) on delete set null,
  dedupe_key text not null unique,
  raw_research jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ai_prospect_leads_pool_idx on public.ai_prospect_leads(status, qualification_score desc, discovered_at desc);
create index if not exists ai_prospect_leads_claim_idx on public.ai_prospect_leads(claimed_by, claim_expires_at);
create index if not exists ai_prospect_leads_country_idx on public.ai_prospect_leads(country);
create index if not exists ai_prospect_leads_domain_idx on public.ai_prospect_leads(domain);

create table if not exists public.crm_ai_customer_alerts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.crm_customers(id) on delete cascade,
  company_name text not null,
  alert_type text not null default 'new_market_intelligence',
  summary text not null,
  contact_updates jsonb not null default '[]'::jsonb,
  source_urls jsonb not null default '[]'::jsonb,
  discovered_at timestamptz not null default now(),
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  unique(customer_id, summary)
);
create index if not exists crm_ai_customer_alerts_customer_idx on public.crm_ai_customer_alerts(customer_id, is_read, discovered_at desc);

alter table public.ai_prospect_leads enable row level security;
alter table public.crm_ai_customer_alerts enable row level security;

drop policy if exists "Sales can read public prospect pool and own claims" on public.ai_prospect_leads;
create policy "Sales can read public prospect pool and own claims" on public.ai_prospect_leads for select to authenticated
using ((select private.crm_current_role())='admin' or ((select private.crm_current_role())='sales' and (status='pool' or (claimed_by=(select auth.uid()) and (claim_expires_at is null or claim_expires_at>now())))));

drop policy if exists "CRM can read AI customer alerts" on public.crm_ai_customer_alerts;
create policy "CRM can read AI customer alerts" on public.crm_ai_customer_alerts for select to authenticated
using ((select private.crm_current_role())='admin' or ((select private.crm_current_role())='sales' and exists(select 1 from public.crm_customers c where c.id=customer_id and c.owner_id=(select auth.uid()))));

drop policy if exists "CRM can mark own AI customer alerts read" on public.crm_ai_customer_alerts;
create policy "CRM can mark own AI customer alerts read" on public.crm_ai_customer_alerts for update to authenticated
using ((select private.crm_current_role())='admin' or ((select private.crm_current_role())='sales' and exists(select 1 from public.crm_customers c where c.id=customer_id and c.owner_id=(select auth.uid()))))
with check (is_read=true);

create or replace function public.crm_ingest_ai_prospect(
 p_company_name text,p_country text,p_website text default null,p_city text default null,p_company_type text default 'unknown',
 p_product_categories text[] default '{}',p_company_profile text default null,p_estimated_scale text default null,
 p_import_evidence text default null,p_contacts jsonb default '[]'::jsonb,p_source_urls jsonb default '[]'::jsonb,
 p_qualification_score integer default 0,p_qualification_notes text default null,p_raw_research jsonb default '{}'::jsonb
) returns jsonb language plpgsql security definer set search_path=''
as $function$
declare
 v_role text := (select private.crm_current_role()); v_domain text; v_key text; v_existing public.ai_prospect_leads%rowtype;
 v_customer public.crm_customers%rowtype; v_summary text; v_id uuid;
begin
 if current_user not in ('postgres','service_role') and v_role is distinct from 'admin' then raise exception 'Only CRM administrators or the trusted database integration may ingest AI prospect research'; end if;
 if nullif(trim(p_company_name),'') is null or nullif(trim(p_country),'') is null then raise exception 'Company name and country are required'; end if;
 if jsonb_typeof(coalesce(p_contacts,'[]'::jsonb))<>'array' or jsonb_typeof(coalesce(p_source_urls,'[]'::jsonb))<>'array' then raise exception 'Contacts and source URLs must be JSON arrays'; end if;
 v_domain:=lower(regexp_replace(coalesce(p_website,''),'^https?://(www\\.)?',''));
 v_domain:=split_part(split_part(v_domain,'/',1),':',1);
 v_key:=coalesce(nullif(v_domain,''),lower(regexp_replace(trim(p_company_name),'[^a-zA-Z0-9]+','','g'))||'|'||lower(trim(p_country)));
 select * into v_customer from public.crm_customers c where lower(trim(c.country))=lower(trim(p_country)) and (
  (v_domain<>'' and lower(regexp_replace(coalesce(c.website,''),'^https?://(www\\.)?','')) like v_domain||'%')
  or lower(trim(c.company_name))=lower(trim(p_company_name))
  or exists(select 1 from jsonb_array_elements(coalesce(p_contacts,'[]'::jsonb)) contact where
   (nullif(contact->>'email','') is not null and lower(contact->>'email')=lower(coalesce(c.email,'')))
   or (nullif(contact->>'whatsapp','') is not null and regexp_replace(contact->>'whatsapp','[^0-9]','','g')=regexp_replace(coalesce(c.whatsapp,''),'[^0-9]','','g'))
   or (nullif(contact->>'phone','') is not null and regexp_replace(contact->>'phone','[^0-9]','','g')=regexp_replace(coalesce(c.phone,''),'[^0-9]','','g'))
  )
 ) order by case when lower(trim(c.company_name))=lower(trim(p_company_name)) then 0 else 1 end limit 1;
 v_summary:='AI 市场情报更新：'||trim(p_company_name)||'；'||coalesce(p_company_profile,'')||case when p_import_evidence is not null then '；采购/进口证据：'||p_import_evidence else '' end;
 if v_customer.id is not null then
  insert into public.crm_ai_customer_alerts(customer_id,company_name,summary,contact_updates,source_urls,discovered_at)
  values(v_customer.id,trim(p_company_name),v_summary,coalesce(p_contacts,'[]'::jsonb),coalesce(p_source_urls,'[]'::jsonb),now())
  on conflict(customer_id,summary) do update set contact_updates=excluded.contact_updates,source_urls=excluded.source_urls,discovered_at=now(),is_read=false;
  return jsonb_build_object('result','matched_existing_customer','customer_id',v_customer.id,'company_name',v_customer.company_name);
 end if;
 select * into v_existing from public.ai_prospect_leads where dedupe_key=v_key for update;
 if found then
  update public.ai_prospect_leads set company_name=trim(p_company_name),country=trim(p_country),city=coalesce(p_city,city),
   website=coalesce(p_website,website),domain=coalesce(nullif(v_domain,''),domain),company_type=coalesce(nullif(p_company_type,''),company_type),
   product_categories=case when cardinality(coalesce(p_product_categories,'{}'))>0 then p_product_categories else product_categories end,
   company_profile=coalesce(p_company_profile,company_profile),estimated_scale=coalesce(p_estimated_scale,estimated_scale),
   import_evidence=coalesce(p_import_evidence,import_evidence),contacts=coalesce(p_contacts,contacts),source_urls=coalesce(p_source_urls,source_urls),
   qualification_score=greatest(qualification_score,least(100,greatest(0,p_qualification_score))),qualification_notes=coalesce(p_qualification_notes,qualification_notes),
   last_verified_at=now(),last_seen_at=now(),raw_research=coalesce(p_raw_research,raw_research),
   status=case when status in ('rejected','converted','matched_customer') then status when status='claimed' and claim_expires_at>now() then status else 'pool' end,
   claimed_by=case when status='claimed' and claim_expires_at>now() then claimed_by else null end,
   claim_expires_at=case when status='claimed' and claim_expires_at>now() then claim_expires_at else null end,updated_at=now()
  where id=v_existing.id returning id into v_id;
  return jsonb_build_object('result','updated_existing_pool_lead','lead_id',v_id);
 end if;
 insert into public.ai_prospect_leads(company_name,normalized_company_name,country,city,website,domain,company_type,product_categories,company_profile,estimated_scale,import_evidence,contacts,source_urls,qualification_score,qualification_notes,last_verified_at,dedupe_key,raw_research)
 values(trim(p_company_name),lower(trim(p_company_name)),trim(p_country),p_city,p_website,nullif(v_domain,''),coalesce(nullif(p_company_type,''),'unknown'),coalesce(p_product_categories,'{}'),p_company_profile,p_estimated_scale,p_import_evidence,coalesce(p_contacts,'[]'::jsonb),coalesce(p_source_urls,'[]'::jsonb),least(100,greatest(0,p_qualification_score)),p_qualification_notes,now(),v_key,coalesce(p_raw_research,'{}'::jsonb))
 returning id into v_id;
 return jsonb_build_object('result','new_public_pool_lead','lead_id',v_id);
end;
$function$;

create or replace function public.crm_claim_ai_prospect(p_lead_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $function$
declare v_role text:=(select private.crm_current_role()); v_uid uuid:=(select auth.uid()); v_row public.ai_prospect_leads%rowtype;
begin
 if v_role not in ('admin','sales') then raise exception 'Only sales users can claim leads'; end if;
 select * into v_row from public.ai_prospect_leads where id=p_lead_id for update;
 if not found then raise exception 'Lead not found'; end if;
 if v_row.status in ('converted','rejected','matched_customer') then raise exception 'This lead is no longer available'; end if;
 if v_row.status='claimed' and v_row.claim_expires_at>now() and v_row.claimed_by is distinct from v_uid then raise exception 'This lead has already been claimed by another salesperson'; end if;
 update public.ai_prospect_leads set status='claimed',claimed_by=v_uid,claimed_at=now(),claim_expires_at=now()+interval '30 days',updated_at=now() where id=p_lead_id;
 return jsonb_build_object('lead_id',p_lead_id,'claimed_by',v_uid,'claim_expires_at',now()+interval '30 days');
end;
$function$;

create or replace function public.crm_renew_ai_prospect_claim(p_lead_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $function$
declare v_role text:=(select private.crm_current_role()); v_uid uuid:=(select auth.uid());
begin
 update public.ai_prospect_leads set claim_expires_at=now()+interval '30 days',last_seen_at=now(),updated_at=now()
 where id=p_lead_id and status='claimed' and claimed_by=v_uid and v_role in ('admin','sales');
 if not found then raise exception 'Claim not owned by current user'; end if;
 return jsonb_build_object('lead_id',p_lead_id,'claim_expires_at',now()+interval '30 days');
end;
$function$;

revoke all on function public.crm_ingest_ai_prospect(text,text,text,text,text,text[],text,text,text,jsonb,jsonb,integer,text,jsonb) from public,anon,authenticated;
grant execute on function public.crm_ingest_ai_prospect(text,text,text,text,text,text[],text,text,text,jsonb,jsonb,integer,text,jsonb) to service_role;
revoke all on function public.crm_claim_ai_prospect(uuid) from public,anon;
grant execute on function public.crm_claim_ai_prospect(uuid) to authenticated;
revoke all on function public.crm_renew_ai_prospect_claim(uuid) from public,anon;
grant execute on function public.crm_renew_ai_prospect_claim(uuid) to authenticated;
