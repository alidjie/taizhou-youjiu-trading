alter table public.crm_orders add column if not exists quote_valid_until date;

CREATE OR REPLACE FUNCTION public.crm_convert_quote_to_order(p_quote_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_quote public.crm_quotes%rowtype;
  v_order_id uuid;
  v_order_no text;
begin
  if (select private.crm_current_role()) not in ('admin','sales') then
    raise exception 'Not authorized to convert quotes';
  end if;
  select * into v_quote from public.crm_quotes where id=p_quote_id for update;
  if not found then raise exception 'Quote not found or access denied'; end if;
  select id into v_order_id from public.crm_orders where source_quote_id=p_quote_id;
  if v_order_id is not null then return v_order_id; end if;
  if v_quote.status in ('rejected','expired','converted') then raise exception 'This quote cannot be converted'; end if;

  v_order_no := 'SO-' || to_char(current_date,'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
  insert into public.crm_orders(
    order_no,source_quote_id,customer_id,owner_id,status,order_date,quote_valid_until,
    incoterm,trade_term,loading_port,destination_port,payment_terms,
    delivery_terms,packaging_terms,warranty_terms,delivery_progress,
    buyer_snapshot,seller_snapshot,branding_snapshot,total_usd,total_cny,notes
  ) values (
    v_order_no,p_quote_id,v_quote.customer_id,v_quote.owner_id,'ordered',current_date,v_quote.valid_until,
    v_quote.incoterm,v_quote.trade_term,v_quote.loading_port,v_quote.destination_port,v_quote.payment_terms,
    v_quote.delivery_terms,v_quote.packaging_terms,v_quote.warranty_terms,
    'Order created from quotation ' || v_quote.quote_no,
    v_quote.buyer_snapshot,v_quote.seller_snapshot,v_quote.branding_snapshot,
    v_quote.total_usd,v_quote.total_cny,v_quote.remarks
  ) returning id into v_order_id;

  insert into public.crm_order_items(
    order_id,source_quote_item_id,line_no,product_id,factory_id,model_code,product_name,
    description,price_basis,quantity,packing_quantity,unit_price,product_snapshot,image_url
  )
  select v_order_id,i.id,i.line_no,i.product_id,i.factory_id,i.model_code,i.product_name,
         i.description,i.price_basis,i.quantity,i.packing_quantity,i.unit_price,i.product_snapshot,i.image_url
  from public.crm_quote_items i where i.quote_id=p_quote_id order by i.line_no;

  update public.crm_quotes set status='converted',updated_at=now() where id=p_quote_id;
  insert into public.crm_order_updates(order_id,updated_by,status,progress_description)
  values (v_order_id,(select auth.uid()),'ordered','Order created from quotation ' || v_quote.quote_no);
  return v_order_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.crm_create_trade_document(p_order_id uuid, p_document_type text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_order public.crm_orders%rowtype;
  v_doc_id uuid;
  v_doc_no text;
  v_factory_id uuid;
  v_factory_count integer;
  v_branding jsonb;
begin
  if (select private.crm_current_role()) not in ('admin','sales') then raise exception 'Not authorized to create trade documents'; end if;
  if upper(p_document_type) not in ('CI','PI','PL') then raise exception 'Document type must be CI, PI or PL'; end if;
  select * into v_order from public.crm_orders where id=p_order_id;
  if not found then raise exception 'Order not found or access denied'; end if;
  if (select private.crm_current_role())='sales' and v_order.owner_id <> (select auth.uid()) then
    raise exception 'Sales users can only create documents for their own orders';
  end if;

  select id,document_no into v_doc_id,v_doc_no
  from public.crm_trade_documents
  where order_id=p_order_id and document_type=upper(p_document_type)
  order by created_at desc limit 1;
  if v_doc_id is not null then return jsonb_build_object('id',v_doc_id,'document_no',v_doc_no,'existing',true); end if;

  select count(distinct factory_id),(array_agg(distinct factory_id) filter (where factory_id is not null))[1]
  into v_factory_count,v_factory_id from public.crm_order_items where order_id=p_order_id;
  if v_factory_count=1 and v_factory_id is not null then
    select to_jsonb(b) into v_branding from public.crm_branding_settings b
    where b.scope='factory' and b.factory_id=v_factory_id order by b.updated_at desc limit 1;
  end if;
  if v_branding is null then
    select to_jsonb(b) into v_branding from public.crm_branding_settings b
    where b.scope='company' and b.factory_id is null order by b.updated_at desc limit 1;
  end if;

  v_doc_no := case upper(p_document_type)
    when 'CI' then 'INV-' || v_order.order_no
    when 'PI' then 'PI-' || v_order.order_no
    when 'PL' then 'PL-' || v_order.order_no
  end;

  insert into public.crm_trade_documents(
    order_id,document_type,document_no,document_date,status,header_fields,terms_fields,
    shipping_fields,declaration_fields,buyer_snapshot,seller_snapshot,order_snapshot,branding_snapshot,created_by
  ) values (
    p_order_id,upper(p_document_type),v_doc_no,current_date,'draft',
    jsonb_build_object('order_no',v_order.order_no,'contract_no',v_order.order_no,'shipping_marks','N/M'),
    jsonb_build_object(
      'incoterm',v_order.incoterm,'trade_term',v_order.trade_term,'payment_terms',v_order.payment_terms,
      'quote_valid_until',v_order.quote_valid_until,'expected_delivery_date',v_order.expected_delivery_date,
      'delivery_terms',v_order.delivery_terms,'packaging_terms',v_order.packaging_terms,
      'warranty_terms',v_order.warranty_terms,'origin','China','remarks',coalesce(v_order.notes,'')
    ),
    jsonb_build_object(
      'loading_port',v_order.loading_port,'destination_port',v_order.destination_port,
      'container_no','','seal_no','','shipping_date','','gross_weight','','net_weight','','volume','','package_count',''
    ),
    jsonb_build_object('declaration','We hereby certify that the information stated in this document is true and correct.'),
    v_order.buyer_snapshot,v_order.seller_snapshot,to_jsonb(v_order),coalesce(v_branding,'{}'::jsonb),(select auth.uid())
  ) returning id into v_doc_id;

  insert into public.crm_trade_document_items(document_id,order_item_id,line_no,item_fields)
  select v_doc_id,oi.id,oi.line_no,jsonb_build_object(
    'model_code',oi.model_code,'product_name',oi.product_name,'description',oi.description,
    'quantity',oi.quantity,'unit','PCS','price_basis',oi.price_basis,'unit_price',oi.unit_price,
    'line_total',oi.line_total,'packing_quantity_40hq',oi.packing_quantity,'package_count','',
    'image_url',oi.image_url,'gross_weight','','net_weight','','volume',''
  )
  from public.crm_order_items oi where oi.order_id=p_order_id order by oi.line_no;

  return jsonb_build_object('id',v_doc_id,'document_no',v_doc_no,'existing',false);
end;
$function$;

CREATE OR REPLACE FUNCTION public.crm_reset_trade_document(p_document_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_doc public.crm_trade_documents%rowtype;
  v_order public.crm_orders%rowtype;
  v_factory_id uuid;
  v_factory_count integer;
  v_branding jsonb;
  v_doc_no text;
begin
  select * into v_doc from public.crm_trade_documents where id=p_document_id;
  if not found then raise exception 'Trade document not found or access denied'; end if;
  if (select private.crm_current_role()) not in ('admin','sales') then raise exception 'Not authorized to reset trade documents'; end if;
  select * into v_order from public.crm_orders where id=v_doc.order_id;
  if not found then raise exception 'Source order not found or access denied'; end if;
  if (select private.crm_current_role())='sales' and v_order.owner_id <> (select auth.uid()) then
    raise exception 'Sales users can only reset documents for their own orders';
  end if;

  select count(distinct factory_id),(array_agg(distinct factory_id) filter (where factory_id is not null))[1]
  into v_factory_count,v_factory_id from public.crm_order_items where order_id=v_order.id;
  if v_factory_count=1 and v_factory_id is not null then
    select to_jsonb(b) into v_branding from public.crm_branding_settings b
    where b.scope='factory' and b.factory_id=v_factory_id order by b.updated_at desc limit 1;
  end if;
  if v_branding is null then
    select to_jsonb(b) into v_branding from public.crm_branding_settings b
    where b.scope='company' and b.factory_id is null order by b.updated_at desc limit 1;
  end if;

  v_doc_no := case v_doc.document_type when 'CI' then 'INV-' || v_order.order_no
    when 'PI' then 'PI-' || v_order.order_no when 'PL' then 'PL-' || v_order.order_no end;

  update public.crm_trade_documents
  set document_no=v_doc_no,document_date=current_date,status='draft',
      header_fields=jsonb_build_object('order_no',v_order.order_no,'contract_no',v_order.order_no,'shipping_marks','N/M'),
      terms_fields=jsonb_build_object(
        'incoterm',v_order.incoterm,'trade_term',v_order.trade_term,'payment_terms',v_order.payment_terms,
        'quote_valid_until',v_order.quote_valid_until,'expected_delivery_date',v_order.expected_delivery_date,
        'delivery_terms',v_order.delivery_terms,'packaging_terms',v_order.packaging_terms,
        'warranty_terms',v_order.warranty_terms,'origin','China','remarks',coalesce(v_order.notes,'')
      ),
      shipping_fields=jsonb_build_object(
        'loading_port',v_order.loading_port,'destination_port',v_order.destination_port,
        'container_no','','seal_no','','shipping_date','','gross_weight','','net_weight','','volume','','package_count',''
      ),
      declaration_fields=jsonb_build_object('declaration','We hereby certify that the information stated in this document is true and correct.'),
      buyer_snapshot=v_order.buyer_snapshot,seller_snapshot=v_order.seller_snapshot,
      order_snapshot=to_jsonb(v_order),branding_snapshot=coalesce(v_branding,'{}'::jsonb),updated_at=now()
  where id=p_document_id;

  delete from public.crm_trade_document_items where document_id=p_document_id;
  insert into public.crm_trade_document_items(document_id,order_item_id,line_no,item_fields)
  select p_document_id,oi.id,oi.line_no,jsonb_build_object(
    'model_code',oi.model_code,'product_name',oi.product_name,'description',oi.description,
    'quantity',oi.quantity,'unit','PCS','price_basis',oi.price_basis,'unit_price',oi.unit_price,
    'line_total',oi.line_total,'packing_quantity_40hq',oi.packing_quantity,'package_count','',
    'image_url',oi.image_url,'gross_weight','','net_weight','','volume',''
  )
  from public.crm_order_items oi where oi.order_id=v_order.id order by oi.line_no;

  return jsonb_build_object('id',p_document_id,'document_no',v_doc_no,'reset',true);
end;
$function$;
