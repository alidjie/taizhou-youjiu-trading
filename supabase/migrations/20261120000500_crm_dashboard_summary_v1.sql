create or replace function public.crm_dashboard_summary()
returns jsonb
language plpgsql
stable
security invoker
set search_path to ''
as $function$
declare
  v_role text := (select private.crm_current_role());
  v_customers bigint;
  v_won bigint;
  v_orders bigint;
  v_usd numeric(16,2);
  v_cny numeric(16,2);
begin
  if v_role not in ('admin','sales') then
    raise exception 'Not authorized to view sales dashboard';
  end if;
  select count(*),count(*) filter (where status='won') into v_customers,v_won
  from public.crm_customers;
  select count(*),coalesce(sum(total_usd),0),coalesce(sum(total_cny),0)
    into v_orders,v_usd,v_cny
  from public.crm_orders where status <> 'cancelled';
  return jsonb_build_object(
    'customers',v_customers,'won',v_won,
    'conversion',case when v_customers=0 then 0 else round(v_won::numeric/v_customers::numeric*100,2) end,
    'orders',v_orders,'usd',v_usd,'cny',v_cny
  );
end;
$function$;
revoke all on function public.crm_dashboard_summary() from public;
grant execute on function public.crm_dashboard_summary() to authenticated;
