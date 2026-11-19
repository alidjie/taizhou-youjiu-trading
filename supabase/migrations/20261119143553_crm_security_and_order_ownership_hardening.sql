-- CRM security hardening: remove unauthenticated access to all CRM tables.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.oid::regclass AS relation_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public'
      AND c.relname LIKE 'crm_%'
      AND c.relkind IN ('r','p')
  LOOP
    EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE %s FROM PUBLIC, anon', r.relation_name);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE %s TO authenticated', r.relation_name);
  END LOOP;
END $$;

CREATE OR REPLACE VIEW public.crm_sales_performance
WITH (security_invoker = true)
AS
WITH order_stats AS (
  SELECT o.owner_id,
         COALESCE(sum(o.total_usd), 0::numeric)::numeric(16,2) AS order_total_usd,
         COALESCE(sum(o.total_cny), 0::numeric)::numeric(16,2) AS order_total_cny,
         count(*)::integer AS order_count
  FROM public.crm_orders o
  WHERE o.status <> 'cancelled'
  GROUP BY o.owner_id
),
customer_stats AS (
  SELECT c.owner_id,
         count(*)::integer AS customer_count,
         count(*) FILTER (WHERE c.status = 'won')::integer AS won_customer_count
  FROM public.crm_customers c
  GROUP BY c.owner_id
)
SELECT p.user_id AS sales_user_id,
       p.username,
       p.full_name,
       COALESCE(o.order_total_usd,0::numeric)::numeric(16,2) AS order_total_usd,
       COALESCE(o.order_total_cny,0::numeric)::numeric(16,2) AS order_total_cny,
       COALESCE(o.order_count,0) AS order_count,
       COALESCE(c.customer_count,0) AS customer_count,
       COALESCE(c.won_customer_count,0) AS won_customer_count,
       CASE WHEN COALESCE(c.customer_count,0)=0 THEN 0::numeric
            ELSE round(COALESCE(c.won_customer_count,0)::numeric / c.customer_count::numeric * 100::numeric,2)
       END AS conversion_rate
FROM public.crm_user_profiles p
LEFT JOIN order_stats o ON o.owner_id=p.user_id
LEFT JOIN customer_stats c ON c.owner_id=p.user_id
WHERE p.role='sales' AND p.is_active=true;

REVOKE ALL PRIVILEGES ON TABLE public.crm_sales_performance FROM PUBLIC, anon;
GRANT SELECT ON TABLE public.crm_sales_performance TO authenticated;

REVOKE ALL ON FUNCTION public.crm_create_quote(jsonb,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crm_create_quote(jsonb,jsonb) TO authenticated;
REVOKE ALL ON FUNCTION public.crm_convert_quote_to_order(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crm_convert_quote_to_order(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.crm_create_product_with_prices(jsonb,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crm_create_product_with_prices(jsonb,jsonb) TO authenticated;
REVOKE ALL ON FUNCTION public.crm_next_number(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crm_next_number(text) TO authenticated;
REVOKE ALL ON FUNCTION public.crm_refresh_quote_totals() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.crm_current_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.crm_current_role() TO authenticated;
REVOKE ALL ON FUNCTION private.crm_current_factory_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.crm_current_factory_id() TO authenticated;

DROP POLICY IF EXISTS crm_orders_insert ON public.crm_orders;
CREATE POLICY crm_orders_insert ON public.crm_orders
FOR INSERT TO authenticated
WITH CHECK (
  (select private.crm_current_role()) = 'admin'
  OR (
    (select private.crm_current_role()) = 'sales'
    AND owner_id = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.crm_customers c
      WHERE c.id = crm_orders.customer_id
        AND c.owner_id = (select auth.uid())
    )
    AND (
      source_quote_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.crm_quotes q
        WHERE q.id = crm_orders.source_quote_id
          AND q.owner_id = (select auth.uid())
          AND q.customer_id = crm_orders.customer_id
      )
    )
  )
);

DROP POLICY IF EXISTS crm_orders_update ON public.crm_orders;
CREATE POLICY crm_orders_update ON public.crm_orders
FOR UPDATE TO authenticated
USING (
  (select private.crm_current_role()) = 'admin'
  OR (
    (select private.crm_current_role()) = 'sales'
    AND owner_id = (select auth.uid())
  )
)
WITH CHECK (
  (select private.crm_current_role()) = 'admin'
  OR (
    (select private.crm_current_role()) = 'sales'
    AND owner_id = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.crm_customers c
      WHERE c.id = crm_orders.customer_id
        AND c.owner_id = (select auth.uid())
    )
    AND (
      source_quote_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.crm_quotes q
        WHERE q.id = crm_orders.source_quote_id
          AND q.owner_id = (select auth.uid())
          AND q.customer_id = crm_orders.customer_id
      )
    )
  )
);
