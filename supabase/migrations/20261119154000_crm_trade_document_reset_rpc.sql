CREATE OR REPLACE FUNCTION public.crm_reset_trade_document(p_document_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO ''
AS $function$
DECLARE
  v_doc public.crm_trade_documents%rowtype;
  v_order public.crm_orders%rowtype;
  v_factory_id uuid;
  v_factory_count integer;
  v_branding jsonb;
  v_doc_no text;
BEGIN
  SELECT * INTO v_doc FROM public.crm_trade_documents WHERE id=p_document_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Trade document not found or access denied'; END IF;
  IF (SELECT private.crm_current_role()) NOT IN ('admin','sales') THEN RAISE EXCEPTION 'Not authorized to reset trade documents'; END IF;

  SELECT * INTO v_order FROM public.crm_orders WHERE id=v_doc.order_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Source order not found or access denied'; END IF;
  IF (SELECT private.crm_current_role())='sales' AND v_order.owner_id <> (SELECT auth.uid()) THEN
    RAISE EXCEPTION 'Sales users can only reset documents for their own orders';
  END IF;

  SELECT count(DISTINCT factory_id),
         (array_agg(DISTINCT factory_id) FILTER (WHERE factory_id IS NOT NULL))[1]
  INTO v_factory_count,v_factory_id
  FROM public.crm_order_items WHERE order_id=v_order.id;

  IF v_factory_count=1 AND v_factory_id IS NOT NULL THEN
    SELECT to_jsonb(b) INTO v_branding FROM public.crm_branding_settings b
    WHERE b.scope='factory' AND b.factory_id=v_factory_id ORDER BY b.updated_at DESC LIMIT 1;
  END IF;
  IF v_branding IS NULL THEN
    SELECT to_jsonb(b) INTO v_branding FROM public.crm_branding_settings b
    WHERE b.scope='company' AND b.factory_id IS NULL ORDER BY b.updated_at DESC LIMIT 1;
  END IF;

  v_doc_no := CASE v_doc.document_type
    WHEN 'CI' THEN 'INV-' || v_order.order_no
    WHEN 'PI' THEN 'PI-' || v_order.order_no
    WHEN 'PL' THEN 'PL-' || v_order.order_no
  END;

  UPDATE public.crm_trade_documents
  SET document_no=v_doc_no,document_date=CURRENT_DATE,status='draft',
      header_fields=jsonb_build_object('order_no',v_order.order_no,'contract_no',v_order.order_no,'shipping_marks','N/M'),
      terms_fields=jsonb_build_object('incoterm',v_order.incoterm,'trade_term',v_order.trade_term,'payment_terms',v_order.payment_terms,'origin','China','remarks',COALESCE(v_order.notes,'')),
      shipping_fields=jsonb_build_object('loading_port',v_order.loading_port,'destination_port',v_order.destination_port,'container_no','','seal_no','','shipping_date','','gross_weight','','net_weight','','volume','','package_count',''),
      declaration_fields=jsonb_build_object('declaration','We hereby certify that the information stated in this document is true and correct.'),
      buyer_snapshot=v_order.buyer_snapshot,seller_snapshot=v_order.seller_snapshot,
      order_snapshot=to_jsonb(v_order),branding_snapshot=COALESCE(v_branding,'{}'::jsonb),updated_at=now()
  WHERE id=p_document_id;

  DELETE FROM public.crm_trade_document_items WHERE document_id=p_document_id;
  INSERT INTO public.crm_trade_document_items(document_id,order_item_id,line_no,item_fields)
  SELECT p_document_id,oi.id,oi.line_no,jsonb_build_object(
    'model_code',oi.model_code,'product_name',oi.product_name,'description',oi.description,
    'quantity',oi.quantity,'unit','PCS','price_basis',oi.price_basis,'unit_price',oi.unit_price,
    'line_total',oi.line_total,'packing_quantity_40hq',oi.packing_quantity,'image_url',oi.image_url,
    'gross_weight','','net_weight','','volume',''
  )
  FROM public.crm_order_items oi WHERE oi.order_id=v_order.id ORDER BY oi.line_no;

  RETURN jsonb_build_object('id',p_document_id,'document_no',v_doc_no,'reset',true);
END;
$function$;
REVOKE ALL ON FUNCTION public.crm_reset_trade_document(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crm_reset_trade_document(uuid) TO authenticated;
