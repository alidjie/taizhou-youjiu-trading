-- Normalize website hostnames before matching existing CRM customers and deduplicating prospect records.
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
 v_domain:=lower(coalesce(p_website,''));
 v_domain:=regexp_replace(v_domain,'^https?://','');
 v_domain:=regexp_replace(v_domain,'^www[.]','');
 v_domain:=split_part(split_part(v_domain,'/',1),':',1);
 v_key:=coalesce(nullif(v_domain,''),lower(regexp_replace(trim(p_company_name),'[^a-zA-Z0-9]+','','g'))||'|'||lower(trim(p_country)));
 select * into v_customer from public.crm_customers c where lower(trim(c.country))=lower(trim(p_country)) and (
  (v_domain<>'' and lower(regexp_replace(regexp_replace(coalesce(c.website,''),'^https?://',''),'^www[.]','')) like v_domain||'%')
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
