drop policy if exists "Sales can read public prospect pool and own claims" on public.ai_prospect_leads;
create policy "Sales can read public prospect pool and own claims"
on public.ai_prospect_leads for select to authenticated
using (
 (select private.crm_current_role())='admin'
 or (
  (select private.crm_current_role())='sales'
  and (
   status='pool'
   or (status='claimed' and claim_expires_at<=now())
   or (claimed_by=(select auth.uid()) and (claim_expires_at is null or claim_expires_at>now()))
  )
 )
);
revoke update on table public.crm_ai_customer_alerts from authenticated;
grant update(is_read) on table public.crm_ai_customer_alerts to authenticated;
