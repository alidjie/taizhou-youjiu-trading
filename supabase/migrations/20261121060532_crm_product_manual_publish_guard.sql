create or replace function private.crm_guard_product_publication()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if tg_op = 'INSERT' then
    if coalesce(new.published, false)
       and (select private.crm_current_role()) is distinct from 'admin' then
      raise exception 'Only CRM administrators may publish products to the public website';
    end if;
  elsif new.published is distinct from old.published then
    if (select private.crm_current_role()) is distinct from 'admin' then
      raise exception 'Only CRM administrators may change website publication status';
    end if;
  end if;

  return new;
end;
$function$;

drop trigger if exists crm_products_publication_guard on public.products;

create trigger crm_products_publication_guard
before insert or update of published
on public.products
for each row
execute function private.crm_guard_product_publication();
