drop policy if exists "CRM admin upload product media" on storage.objects;
drop policy if exists "CRM admin update product media" on storage.objects;
drop policy if exists "CRM admin delete product media" on storage.objects;
drop policy if exists "CRM factory upload own product media" on storage.objects;
drop policy if exists "CRM factory update own product media" on storage.objects;
drop policy if exists "CRM factory delete own product media" on storage.objects;

create policy "CRM admin upload product media" on storage.objects for insert to authenticated with check (
 bucket_id='products' and split_part(name,'/',1)='crm' and split_part(name,'/',2)='admin' and (select private.crm_current_role())='admin'
);
create policy "CRM admin update product media" on storage.objects for update to authenticated using (
 bucket_id='products' and split_part(name,'/',1)='crm' and split_part(name,'/',2)='admin' and (select private.crm_current_role())='admin'
) with check (
 bucket_id='products' and split_part(name,'/',1)='crm' and split_part(name,'/',2)='admin' and (select private.crm_current_role())='admin'
);
create policy "CRM admin delete product media" on storage.objects for delete to authenticated using (
 bucket_id='products' and split_part(name,'/',1)='crm' and split_part(name,'/',2)='admin' and (select private.crm_current_role())='admin'
);
create policy "CRM factory upload own product media" on storage.objects for insert to authenticated with check (
 bucket_id='products' and split_part(name,'/',1)='crm' and split_part(name,'/',2)='factory'
 and split_part(name,'/',3)=(select private.crm_current_factory_id())::text
 and (select private.crm_current_role())='factory'
);
create policy "CRM factory update own product media" on storage.objects for update to authenticated using (
 bucket_id='products' and split_part(name,'/',1)='crm' and split_part(name,'/',2)='factory'
 and split_part(name,'/',3)=(select private.crm_current_factory_id())::text
 and (select private.crm_current_role())='factory'
) with check (
 bucket_id='products' and split_part(name,'/',1)='crm' and split_part(name,'/',2)='factory'
 and split_part(name,'/',3)=(select private.crm_current_factory_id())::text
 and (select private.crm_current_role())='factory'
);
create policy "CRM factory delete own product media" on storage.objects for delete to authenticated using (
 bucket_id='products' and split_part(name,'/',1)='crm' and split_part(name,'/',2)='factory'
 and split_part(name,'/',3)=(select private.crm_current_factory_id())::text
 and (select private.crm_current_role())='factory'
);
