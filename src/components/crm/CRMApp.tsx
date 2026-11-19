"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const API = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fsqpeuulaglnnwfyxndj.supabase.co";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_27Jb43sOATe3CJlIEP-zVQ_-QFD6HOB";
const SESSION_KEY = "youjiu-cms-session";

type Role = "admin" | "sales" | "factory";
type Profile = { user_id:string; username:string; email:string; full_name:string; role:Role; factory_id:string|null; is_active:boolean; created_at?:string };
type Customer = { id:string; company_name:string; contact_name:string; email:string|null; phone:string|null; whatsapp:string|null; website:string|null; address:string|null; country:string; city:string|null; owner_id:string; status:"prospect"|"following"|"won"|"lost"; tags:string[]; notes:string|null; last_contacted_at:string|null; next_followup_at:string|null; created_at:string; updated_at:string };
type Followup = { id:string; customer_id:string; method:string; summary:string; followed_at:string; next_followup_at:string|null };
type Product = { id:string; slug:string; name:string; model_code:string|null; category:string; factory_id:string|null; image:string|null; hero_image:string|null; published:boolean; updated_at:string };
type ProductPrice = { product_id:string; factory_id:string; skd_price_usd:number|null; skd_price_cny:number|null; ckd_price_usd:number|null; ckd_price_cny:number|null; packing_quantity_40hq:number|null };
type Factory = { id:string; factory_code:string; name:string; status:string };
type Quote = { id:string; quote_no:string; customer_id:string; owner_id:string; status:string; total_usd:number; total_cny:number; valid_until:string|null; incoterm:string|null; loading_port:string|null; destination_port:string|null; payment_terms:string|null; delivery_terms:string|null; packaging_terms:string|null; warranty_terms:string|null; remarks:string|null; seller_snapshot:Record<string,unknown>; buyer_snapshot:Record<string,unknown>; branding_snapshot:Record<string,unknown>; created_at:string; updated_at:string };
type QuoteItem = { id:string; quote_id:string; product_id:string|null; factory_id:string|null; line_no:number; model_code:string|null; product_name:string; description:string|null; price_basis:string; quantity:number; packing_quantity:number|null; unit_price:number; line_total:number; product_snapshot:Record<string,unknown>; image_url:string|null };\ntype QuoteEmailLog = { id:string; recipient:string; subject:string; method:string; sent_at:string; body:string|null; metadata:Record<string,unknown> };
type QuoteLineDraft = { id:string; product_id:string; price_basis:string; quantity:string };
type Order = { id:string; order_no:string; customer_id:string; status:string; total_usd:number; total_cny:number; order_date:string; expected_delivery_date:string|null; actual_delivery_date:string|null; delivery_progress:string|null; buyer_snapshot:{company_name?:string;contact_name?:string;country?:string} };
type OrderUpdate = { id:string; order_id:string; status:string|null; progress_description:string; expected_delivery_date:string|null; actual_delivery_date:string|null; created_at:string };
type Branding = { id:string; scope:"company"|"factory"; factory_id:string|null; logo_url:string|null; stamp_url:string|null; legal_name:string|null; address:string|null; telephone:string|null; email:string|null; website:string|null; bank_name:string|null; bank_address:string|null; beneficiary:string|null; account_number:string|null; swift_code:string|null; additional_bank_details:Record<string,unknown>; updated_at?:string };
type Doc = { id:string; document_type:string; document_no:string; status:string; document_date:string; order_id:string; header_fields:Record<string,unknown>; terms_fields:Record<string,unknown>; shipping_fields:Record<string,unknown>; declaration_fields:Record<string,unknown>; buyer_snapshot:Record<string,unknown>; seller_snapshot:Record<string,unknown>; order_snapshot:Record<string,unknown>; branding_snapshot:Record<string,unknown> };
type DocItem = { id:string; document_id:string; line_no:number; item_fields:Record<string,unknown> };
type Perf = { sales_user_id:string; username:string; full_name:string; order_total_usd:number; order_total_cny:number; order_count:number; customer_count:number; won_customer_count:number; conversion_rate:number };
type Module = "dashboard"|"customers"|"products"|"quotes"|"orders"|"documents"|"accounts"|"branding"|"password";
const labels:Record<string,string> = { prospect:"潜在客户",following:"跟进中",won:"已成交",lost:"已流失",draft:"草稿",sent:"已发送",accepted:"已接受",rejected:"已拒绝",expired:"已过期",converted:"已转订单",quoted:"已报价",ordered:"已下单",production:"生产中",shipped:"已发货",completed:"已完成",cancelled:"已取消",final:"已确认" };
const roleLabels:Record<Role,string> = {admin:"管理员",sales:"销售员",factory:"工厂用户"};
const cats = [{value:"electric-motorcycles",label:"Electric Motorcycles"},{value:"electric-bicycles",label:"Electric Bicycles"},{value:"electric-motors",label:"Electric Motors"},{value:"suspension-systems",label:"Suspension Systems"}];
const cash=(n:number,c:"USD"|"CNY")=>new Intl.NumberFormat("en-US",{style:"currency",currency:c,maximumFractionDigits:2}).format(Number(n||0));
const d=(s:string|null|undefined)=>s?new Date(s).toLocaleDateString("zh-CN"):"—";
const slug=(s:string)=>s.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
const hdr=(token:string)=>({apikey:KEY,Authorization:"Bearer "+token,"Content-Type":"application/json"});

export default function CRMApp(){
 const [token,setToken]=useState(""),[userId,setUserId]=useState("");
 const [profile,setProfile]=useState<Profile|null>(null),[email,setEmail]=useState(""),[password,setPassword]=useState("");
 const [loading,setLoading]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [module,setModule]=useState<Module>("dashboard"),[drawer,setDrawer]=useState(false);
 const [customers,setCustomers]=useState<Customer[]>([]),[search,setSearch]=useState(""),[statusFilter,setStatusFilter]=useState("all");
 const [selected,setSelected]=useState<Customer|null>(null),[followups,setFollowups]=useState<Followup[]>([]);
 const [customerOpen,setCustomerOpen]=useState(false),[customerDraft,setCustomerDraft]=useState({company_name:"",contact_name:"",email:"",phone:"",whatsapp:"",website:"",address:"",country:"",city:"",notes:"",tags:""}),[customerEditOpen,setCustomerEditOpen]=useState(false),[customerEditDraft,setCustomerEditDraft]=useState({company_name:"",contact_name:"",email:"",phone:"",whatsapp:"",website:"",address:"",country:"",city:"",notes:"",tags:""}),[relatedQuotes,setRelatedQuotes]=useState<Quote[]>([]),[relatedOrders,setRelatedOrders]=useState<Order[]>([]);
 const [followupDraft,setFollowupDraft]=useState({method:"email",summary:"",next_followup_at:""});
 const [products,setProducts]=useState<Product[]>([]),[productPrices,setProductPrices]=useState<ProductPrice[]>([]),[factories,setFactories]=useState<Factory[]>([]),[productSearch,setProductSearch]=useState(""),[productOpen,setProductOpen]=useState(false);
 const [productDraft,setProductDraft]=useState({name:"",model_code:"",category:"electric-motorcycles",factory_id:"",skd_price_usd:"",skd_price_cny:"",ckd_price_usd:"",ckd_price_cny:"",packing_quantity_40hq:""});
 const [factoryOpen,setFactoryOpen]=useState(false),[factoryDraft,setFactoryDraft]=useState({factory_code:"",name:"",contact_name:"",email:"",phone:"",address:""});
 const [accountOpen,setAccountOpen]=useState(false),[accountDraft,setAccountDraft]=useState({username:"",email:"",full_name:"",password:"",role:"sales",factory_id:""});
 const [accountSearch,setAccountSearch]=useState(""),[accountRoleFilter,setAccountRoleFilter]=useState("all"),[editingAccount,setEditingAccount]=useState<Profile|null>(null),[editAccountDraft,setEditAccountDraft]=useState({username:"",email:"",full_name:"",role:"sales",factory_id:""});
 const [quotes,setQuotes]=useState<Quote[]>([]),[selectedQuote,setSelectedQuote]=useState<Quote|null>(null),[quoteDetailItems,setQuoteDetailItems]=useState<QuoteItem[]>([]),[quoteEmailLogs,setQuoteEmailLogs]=useState<QuoteEmailLog[]>([]),[quoteEditDraft,setQuoteEditDraft]=useState({valid_until:"",incoterm:"FOB",loading_port:"",destination_port:"",payment_terms:"",delivery_terms:"",packaging_terms:"",warranty_terms:"",remarks:""}),[quoteOpen,setQuoteOpen]=useState(false),[quoteCustomerId,setQuoteCustomerId]=useState(""),[quoteValidUntil,setQuoteValidUntil]=useState(""),[quoteIncoterm,setQuoteIncoterm]=useState("FOB"),[quoteLoadingPort,setQuoteLoadingPort]=useState(""),[quoteDestinationPort,setQuoteDestinationPort]=useState(""),[quotePaymentTerms,setQuotePaymentTerms]=useState(""),[quoteDeliveryTerms,setQuoteDeliveryTerms]=useState(""),[quoteRemarks,setQuoteRemarks]=useState(""),[quoteItems,setQuoteItems]=useState<QuoteLineDraft[]>([]),[quoteLineDraft,setQuoteLineDraft]=useState({product_id:"",price_basis:"SKD_USD",quantity:"1"}),[orders,setOrders]=useState<Order[]>([]),[selectedOrder,setSelectedOrder]=useState<Order|null>(null),[orderUpdates,setOrderUpdates]=useState<OrderUpdate[]>([]),[orderDraft,setOrderDraft]=useState({status:"ordered",progress_description:"",expected_delivery_date:"",actual_delivery_date:""}),[docs,setDocs]=useState<Doc[]>([]),[selectedDoc,setSelectedDoc]=useState<Doc|null>(null),[docItems,setDocItems]=useState<DocItem[]>([]),[docOrderId,setDocOrderId]=useState(""),[docDraft,setDocDraft]=useState({document_no:"",document_date:"",contract_no:"",shipping_marks:"",incoterm:"",payment_terms:"",origin:"China",remarks:"",loading_port:"",destination_port:"",container_no:"",seal_no:"",shipping_date:"",gross_weight:"",net_weight:"",volume:"",package_count:"",declaration:""}),[accounts,setAccounts]=useState<Profile[]>([]);
 const [perf,setPerf]=useState<Perf[]>([]),[kpis,setKpis]=useState({customers:0,won:0,usd:0,cny:0,orders:0});
  const [branding,setBranding]=useState<Branding|null>(null),[brandingDraft,setBrandingDraft]=useState({legal_name:"",address:"",telephone:"",email:"",website:"",bank_name:"",bank_address:"",beneficiary:"",account_number:"",swift_code:"",logo_url:"",stamp_url:""}),[brandingLogo,setBrandingLogo]=useState<File|null>(null),[brandingStamp,setBrandingStamp]=useState<File|null>(null);
 const [newPassword,setNewPassword]=useState(""),[confirmPassword,setConfirmPassword]=useState("");
 const [quoteOriginalItemIds,setQuoteOriginalItemIds]=useState<string[]>([]),[quotePreviewHtml,setQuotePreviewHtml]=useState(""),[quotePreviewOpen,setQuotePreviewOpen]=useState(false),[quotePreviewZoom,setQuotePreviewZoom]=useState(100),[quotePreviewFullScreen,setQuotePreviewFullScreen]=useState(false);
 const quotePreviewFrame=useRef<HTMLIFrameElement|null>(null);

 const req=useCallback(async<T,>(path:string,init:RequestInit={}):Promise<T>=>{
  if(!token)throw new Error("登录状态已失效，请重新登录。");
  const res=await fetch(API+"/rest/v1/"+path,{...init,headers:{...hdr(token),...(init.headers||{})},cache:"no-store"});
  if(!res.ok)throw new Error((await res.text())||("HTTP "+res.status));
  if(res.status===204)return undefined as T;
  const txt=await res.text();return (txt?JSON.parse(txt):undefined) as T;
 },[token]);

 const establish=useCallback(async(access:string,ref:string)=>{
  const u=await fetch(API+"/auth/v1/user",{headers:{apikey:KEY,Authorization:"Bearer "+access},cache:"no-store"});
  if(!u.ok)throw new Error("登录会话校验失败。");
  const user=await u.json() as {id:string};
  const p=await fetch(API+"/rest/v1/crm_user_profiles?select=user_id,username,email,full_name,role,factory_id,is_active&user_id=eq."+encodeURIComponent(user.id)+"&limit=1",{headers:{apikey:KEY,Authorization:"Bearer "+access},cache:"no-store"});
  if(!p.ok)throw new Error("读取 CRM 权限失败，请联系管理员。");
  const rows=await p.json() as Profile[],me=rows[0];
  if(!me||!me.is_active){await fetch(API+"/auth/v1/logout",{method:"POST",headers:{apikey:KEY,Authorization:"Bearer "+access}});throw new Error("账号尚未获得 CRM 授权或已被禁用。");}
  setToken(access);setUserId(user.id);setProfile(me);
  localStorage.setItem(SESSION_KEY,JSON.stringify({refresh_token:ref}));
  setModule(me.role==="factory"?"products":"dashboard");setPassword("");
 },[]);

 useEffect(()=>{
  let active=true;
  try{const saved=localStorage.getItem(SESSION_KEY);const value=saved?JSON.parse(saved) as {refresh_token?:string}:null;
   if(value?.refresh_token)void(async()=>{try{const r=await fetch(API+"/auth/v1/token?grant_type=refresh_token",{method:"POST",headers:{apikey:KEY,"Content-Type":"application/json"},body:JSON.stringify({refresh_token:value.refresh_token})});const j=await r.json() as {access_token?:string;refresh_token?:string};if(!r.ok||!j.access_token||!j.refresh_token)throw new Error("expired");if(active)await establish(j.access_token,j.refresh_token);}catch{localStorage.removeItem(SESSION_KEY);if(active)setError("登录状态已过期，请重新登录。");}})();
  }catch{localStorage.removeItem(SESSION_KEY);}
  return()=>{active=false;};
 },[establish]);

 async function login(e:React.FormEvent){e.preventDefault();setLoading(true);setError("");setNotice("");try{const r=await fetch(API+"/functions/v1/crm-login",{method:"POST",headers:{apikey:KEY,"Content-Type":"application/json"},body:JSON.stringify({username:email.trim(),password}),cache:"no-store"});const j=await r.json() as {access_token?:string;refresh_token?:string;error?:string};if(!r.ok||!j.access_token||!j.refresh_token)throw new Error(j.error||"账号或密码错误。");await establish(j.access_token,j.refresh_token);}catch(e){setError(e instanceof Error?e.message:"登录失败。");}finally{setLoading(false);}}
 async function logout(){try{if(token)await fetch(API+"/auth/v1/logout",{method:"POST",headers:{apikey:KEY,Authorization:"Bearer "+token}});}finally{localStorage.removeItem(SESSION_KEY);setToken("");setUserId("");setProfile(null);setCustomers([]);setProducts([]);setSelected(null);setNotice("已安全退出。");}}

 const loadDashboard=useCallback(async()=>{try{
  const [p,c,o]=await Promise.all([req<Perf[]>("crm_sales_performance?select=*&order=order_total_usd.desc"),req<Array<{id:string;status:string}>>("crm_customers?select=id,status&limit=5000"),req<Array<{id:string;total_usd:number;total_cny:number}>>("crm_orders?select=id,total_usd,total_cny&status=neq.cancelled&limit=5000")]);
  setPerf(p);setKpis({customers:c.length,won:c.filter(x=>x.status==="won").length,usd:o.reduce((s,x)=>s+Number(x.total_usd||0),0),cny:o.reduce((s,x)=>s+Number(x.total_cny||0),0),orders:o.length});
 }catch(e){setError(e instanceof Error?e.message:"看板加载失败。");}},[req]);
 const loadCustomers=useCallback(async()=>{setBusy(true);try{setCustomers(await req<Customer[]>("crm_customers?select=*&order=updated_at.desc&limit=1000"));}catch(e){setError(e instanceof Error?e.message:"客户加载失败。");}finally{setBusy(false);}},[req]);
 const loadProducts=useCallback(async()=>{setBusy(true);try{const [rows,priceRows,factoryRows]=await Promise.all([req<Product[]>("products?select=id,slug,name,model_code,category,factory_id,image,hero_image,published,updated_at&order=created_at.desc&limit=2000"),req<ProductPrice[]>("crm_product_prices?select=product_id,factory_id,skd_price_usd,skd_price_cny,ckd_price_usd,ckd_price_cny,packing_quantity_40hq&limit=2000"),req<Factory[]>("crm_factories?select=id,factory_code,name,status&order=name")]);setProducts(rows);setProductPrices(priceRows);setFactories(factoryRows);}catch(e){setError(e instanceof Error?e.message:"产品加载失败。");}finally{setBusy(false);}},[req]);
 const loadQuotes=useCallback(async()=>{try{setQuotes(await req<Quote[]>("crm_quotes?select=*&order=created_at.desc&limit=500"));}catch(e){setError(e instanceof Error?e.message:"报价加载失败。");}},[req]);
 const loadOrders=useCallback(async()=>{try{setOrders(await req<Order[]>("crm_orders?select=id,order_no,customer_id,status,total_usd,total_cny,order_date,expected_delivery_date,actual_delivery_date,delivery_progress,buyer_snapshot&order=order_date.desc&limit=500"));}catch(e){setError(e instanceof Error?e.message:"订单加载失败。");}},[req]);
 async function openOrder(order:Order){
   setSelectedOrder(order);
   setOrderDraft({status:order.status,progress_description:order.delivery_progress||"",expected_delivery_date:order.expected_delivery_date||"",actual_delivery_date:order.actual_delivery_date||""});
   try{setOrderUpdates(await req<OrderUpdate[]>("crm_order_updates?select=id,order_id,status,progress_description,expected_delivery_date,actual_delivery_date,created_at&order_id=eq."+encodeURIComponent(order.id)+"&order=created_at.desc&limit=200"));}
   catch(e){setError(e instanceof Error?e.message:"订单进度记录加载失败。");}
  }
  async function saveOrderProgress(e:React.FormEvent){
   e.preventDefault();if(!selectedOrder)return;
   if(!orderDraft.progress_description.trim()){setError("请填写本次订单进度说明。");return;}
   setBusy(true);setError("");setNotice("");
   const expected=orderDraft.expected_delivery_date||null;
   const actual=orderDraft.actual_delivery_date||null;
   try{
    await req("crm_orders?id=eq."+encodeURIComponent(selectedOrder.id),{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({status:orderDraft.status,delivery_progress:orderDraft.progress_description.trim(),expected_delivery_date:expected,actual_delivery_date:actual})});
    await req("crm_order_updates",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify({order_id:selectedOrder.id,updated_by:userId,status:orderDraft.status,progress_description:orderDraft.progress_description.trim(),expected_delivery_date:expected,actual_delivery_date:actual})});
    setNotice("订单状态与交付进度已更新。");
    await loadOrders();
    const updated={...selectedOrder,status:orderDraft.status,delivery_progress:orderDraft.progress_description.trim(),expected_delivery_date:expected,actual_delivery_date:actual};
    setSelectedOrder(updated);
    await openOrder(updated);
   }catch(e){setError(e instanceof Error?e.message:"订单进度保存失败。");}
   finally{setBusy(false);}
  }
  const loadDocs=useCallback(async()=>{try{setDocs(await req<Doc[]>("crm_trade_documents?select=*&order=document_date.desc&limit=500"));}catch(e){setError(e instanceof Error?e.message:"单据加载失败。");}},[req]);
 async function openTradeDocument(doc:Doc){
  setSelectedDoc(doc);
  const h=doc.header_fields||{},t=doc.terms_fields||{},sh=doc.shipping_fields||{},de=doc.declaration_fields||{};
  const get=(o:Record<string,unknown>,k:string)=>String(o[k]??"");
  setDocDraft({
   document_no:doc.document_no,document_date:doc.document_date,
   contract_no:get(h,"contract_no")||get(h,"order_no"),shipping_marks:get(h,"shipping_marks"),
   incoterm:get(t,"incoterm"),payment_terms:get(t,"payment_terms"),origin:get(t,"origin")||"China",remarks:get(t,"remarks"),
   loading_port:get(sh,"loading_port"),destination_port:get(sh,"destination_port"),container_no:get(sh,"container_no"),seal_no:get(sh,"seal_no"),shipping_date:get(sh,"shipping_date"),
   gross_weight:get(sh,"gross_weight"),net_weight:get(sh,"net_weight"),volume:get(sh,"volume"),package_count:get(sh,"package_count"),declaration:get(de,"declaration")
  });
  try{setDocItems(await req<DocItem[]>("crm_trade_document_items?select=id,document_id,line_no,item_fields&document_id=eq."+encodeURIComponent(doc.id)+"&order=line_no.asc&limit=500"));}
  catch(e){setError(e instanceof Error?e.message:"单据明细加载失败。");}
 }
 async function createTradeDocument(type:"CI"|"PI"|"PL"){
  if(!docOrderId){setError("请先选择一张订单。");return;}
  setBusy(true);setError("");setNotice("");
  try{
   const result=await req<{id:string;document_no:string;existing:boolean}>("rpc/crm_create_trade_document",{method:"POST",body:JSON.stringify({p_order_id:docOrderId,p_document_type:type})});
   const rows=await req<Doc[]>("crm_trade_documents?select=*&id=eq."+encodeURIComponent(result.id)+"&limit=1");
   if(rows[0])await openTradeDocument(rows[0]);
   await loadDocs();
   setNotice(result.existing?"该订单已有此类单据，已打开原单据。":"已从订单生成 "+type+" 单据："+result.document_no);
  }catch(e){setError(e instanceof Error?e.message:"生成外贸单据失败。");}
  finally{setBusy(false);}
 }
 function updateDocItem(itemId:string,key:string,value:string){
  setDocItems(rows=>rows.map(row=>{
   if(row.id!==itemId)return row;
   const fields={...row.item_fields,[key]:["quantity","unit_price","line_total","packing_quantity_40hq"].includes(key)?(value===""?null:Number(value)):value};
   if(key==="quantity"||key==="unit_price")fields.line_total=Number(fields.quantity||0)*Number(fields.unit_price||0);
   return {...row,item_fields:fields};
  }));
 }
 async function saveTradeDocument(e:React.FormEvent){
  e.preventDefault();if(!selectedDoc)return;
  if(!docDraft.document_no.trim()){setError("单据编号不能为空。");return;}
  setBusy(true);setError("");setNotice("");
  try{
   const payload={
    document_no:docDraft.document_no.trim(),document_date:docDraft.document_date,
    header_fields:{contract_no:docDraft.contract_no,order_no:String(selectedDoc.order_snapshot.order_no||""),shipping_marks:docDraft.shipping_marks},
    terms_fields:{incoterm:docDraft.incoterm,payment_terms:docDraft.payment_terms,origin:docDraft.origin,remarks:docDraft.remarks},
    shipping_fields:{loading_port:docDraft.loading_port,destination_port:docDraft.destination_port,container_no:docDraft.container_no,seal_no:docDraft.seal_no,shipping_date:docDraft.shipping_date,gross_weight:docDraft.gross_weight,net_weight:docDraft.net_weight,volume:docDraft.volume,package_count:docDraft.package_count},
    declaration_fields:{declaration:docDraft.declaration}
   };
   await req("crm_trade_documents?id=eq."+encodeURIComponent(selectedDoc.id),{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify(payload)});
   await Promise.all(docItems.map(item=>req("crm_trade_document_items?id=eq."+encodeURIComponent(item.id),{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({item_fields:item.item_fields})})));
   const rows=await req<Doc[]>("crm_trade_documents?select=*&id=eq."+encodeURIComponent(selectedDoc.id)+"&limit=1");
   if(rows[0])await openTradeDocument(rows[0]);
   await loadDocs();setNotice("单据内容与产品明细已保存。");
  }catch(e){setError(e instanceof Error?e.message:"单据保存失败。请检查编号是否重复。");}
  finally{setBusy(false);}
 }
 async function resetTradeDocument(){
  if(!selectedDoc||!window.confirm("确定按订单当前数据重置？所有手工修改的单据字段和产品明细都会被覆盖。"))return;
  setBusy(true);setError("");setNotice("");
  try{
   await req("rpc/crm_reset_trade_document",{method:"POST",body:JSON.stringify({p_document_id:selectedDoc.id})});
   const rows=await req<Doc[]>("crm_trade_documents?select=*&id=eq."+encodeURIComponent(selectedDoc.id)+"&limit=1");
   if(rows[0])await openTradeDocument(rows[0]);
   await loadDocs();setNotice("已按订单数据重置单据。");
  }catch(e){setError(e instanceof Error?e.message:"单据重置失败。");}
  finally{setBusy(false);}
 }
 function previewTradeDocument(){
  if(!selectedDoc)return;
  const esc=(v:unknown)=>String(v??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[ch]||ch));
  const title=selectedDoc.document_type==="CI"?"COMMERCIAL INVOICE":selectedDoc.document_type==="PI"?"PROFORMA INVOICE":"PACKING LIST";
  const buyer=selectedDoc.buyer_snapshot||{},seller=selectedDoc.seller_snapshot||{},brand=selectedDoc.branding_snapshot||{},order=selectedDoc.order_snapshot||{};
  const logo=String(brand.logo_url||"");const stamp=String(brand.stamp_url||"");
  const rows=docItems.map(item=>{
   const x=item.item_fields||{};
   return "<tr><td>"+esc(x.model_code)+"</td><td>"+esc(x.product_name)+"<br><small>"+esc(x.description)+"</small></td><td class='right'>"+esc(x.quantity)+" "+esc(x.unit||"PCS")+"</td><td class='right'>"+esc(x.unit_price)+"</td><td class='right'>"+esc(x.line_total)+"</td><td class='right'>"+esc(x.gross_weight)+"</td><td class='right'>"+esc(x.net_weight)+"</td></tr>";
  }).join("");
  const buyerName=esc(buyer.company_name||buyer.company||"");
  const sellerName=esc(brand.legal_name||seller.company_name||"YOUJIU");
  const terms=[["Incoterms",docDraft.incoterm],["Payment Terms",docDraft.payment_terms],["Country of Origin",docDraft.origin],["Loading Port",docDraft.loading_port],["Destination Port",docDraft.destination_port],["Container No.",docDraft.container_no],["Seal No.",docDraft.seal_no],["Shipping Date",docDraft.shipping_date],["Gross Weight",docDraft.gross_weight],["Net Weight",docDraft.net_weight],["Volume",docDraft.volume],["Packages",docDraft.package_count]];
  const html=`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)} - ${esc(docDraft.document_no)}</title><style>
  @page{size:A4;margin:14mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#17212b;font-size:11px}h1{font-size:22px;margin:0 0 6px;letter-spacing:.06em}.top{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #263746;padding-bottom:12px;margin-bottom:18px}.top img{max-width:190px;max-height:65px;object-fit:contain}.muted{color:#637180}.meta{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:16px 0}.panel{border:1px solid #cbd5df;padding:10px;min-height:88px}.panel b{display:block;margin-bottom:6px;text-transform:uppercase;font-size:10px;color:#536273}.row{display:flex;justify-content:space-between;gap:20px;margin:4px 0}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0}.field{border:1px solid #d5dde5;padding:7px;min-height:36px}.field b{display:block;color:#667482;font-size:9px;text-transform:uppercase;margin-bottom:3px}table{width:100%;border-collapse:collapse;margin-top:14px}th{background:#e9eef2;text-align:left;font-size:9px;text-transform:uppercase}td,th{border:1px solid #cbd5df;padding:7px;vertical-align:top}.right{text-align:right}.totals{text-align:right;margin-top:12px;font-size:13px;font-weight:bold}.declaration{margin-top:22px;border-top:1px solid #cbd5df;padding-top:12px;line-height:1.55}.signature{display:flex;justify-content:flex-end;margin-top:24px;min-height:105px}.signature img{max-height:85px;max-width:150px;object-fit:contain}.footer{border-top:1px solid #cbd5df;margin-top:25px;padding-top:8px;color:#657482;font-size:9px}@media print{button{display:none}}</style></head><body>
   <div class="top"><div>${logo?'<img src="'+esc(logo)+'" alt="Logo">':'<strong>'+sellerName+'</strong>'}</div><div style="text-align:right"><h1>${esc(title)}</h1><div><b>Document No.:</b> ${esc(docDraft.document_no)}</div><div><b>Date:</b> ${esc(docDraft.document_date)}</div><div><b>Order No.:</b> ${esc(order.order_no||docDraft.contract_no)}</div></div></div>
   <div class="meta"><div class="panel"><b>Seller / Exporter</b><strong>${sellerName}</strong><div>${esc(brand.address||seller.address)}</div><div>${esc(brand.telephone||seller.telephone)}</div><div>${esc(brand.email||seller.email)}</div></div><div class="panel"><b>Buyer / Importer</b><strong>${buyerName}</strong><div>${esc(buyer.contact_name)}</div><div>${esc(buyer.address)}</div><div>${esc(buyer.country)}</div><div>${esc(buyer.email)}</div></div></div>
   <div class="grid">${terms.map(([k,v])=>'<div class="field"><b>'+esc(k)+'</b>'+esc(v)+'</div>').join("")}</div>
   <table><thead><tr><th>Model</th><th>Description of Goods</th><th class="right">Quantity</th><th class="right">Unit Price</th><th class="right">Amount</th><th class="right">G.W.</th><th class="right">N.W.</th></tr></thead><tbody>${rows||'<tr><td colspan="7">No items</td></tr>'}</tbody></table>
   <div class="totals">Total USD: ${esc(order.total_usd||"—")} &nbsp; | &nbsp; Total CNY: ${esc(order.total_cny||"—")}</div>
   <div class="declaration"><b>Declaration / Remarks</b><p>${esc(docDraft.declaration)}</p><p>${esc(docDraft.remarks)}</p></div>
   <div class="signature">${stamp?'<img src="'+esc(stamp)+'" alt="Stamp">':'<div>Authorized Signature / Company Stamp</div>'}</div>
   <div class="footer">${sellerName} · ${esc(brand.website||seller.website)}</div>
  </body></html>`;
  const win=window.open("","_blank");
  if(!win){setError("浏览器阻止了预览窗口，请允许该站点打开弹出窗口后重试。");return;}
  win.document.open();win.document.write(html);win.document.close();win.focus();win.print();
 }
 const loadBranding=useCallback(async()=>{
   if(!profile)return;
   try{
    const scope=profile.role==="admin"?"company":"factory";
    if(scope==="factory"&&!profile.factory_id)throw new Error("当前工厂账号未绑定工厂。");
    const query=scope==="company"?"crm_branding_settings?select=*&scope=eq.company&limit=1":"crm_branding_settings?select=*&scope=eq.factory&factory_id=eq."+encodeURIComponent(profile.factory_id||"")+"&limit=1";
    const rows=await req<Branding[]>(query);
    const row=rows[0]||null;setBranding(row);
    setBrandingDraft({legal_name:row?.legal_name||"",address:row?.address||"",telephone:row?.telephone||"",email:row?.email||"",website:row?.website||"",bank_name:row?.bank_name||"",bank_address:row?.bank_address||"",beneficiary:row?.beneficiary||"",account_number:row?.account_number||"",swift_code:row?.swift_code||"",logo_url:row?.logo_url||"",stamp_url:row?.stamp_url||""});
    setBrandingLogo(null);setBrandingStamp(null);
   }catch(e){setError(e instanceof Error?e.message:"报价单品牌设置加载失败。");}
  },[profile,req]);
 const loadAccounts=useCallback(async()=>{try{const [rows,fs]=await Promise.all([req<Profile[]>("crm_user_profiles?select=user_id,username,email,full_name,role,factory_id,is_active,created_at&order=created_at.desc"),req<Factory[]>("crm_factories?select=id,factory_code,name,status&order=name")]);setAccounts(rows);setFactories(fs);}catch(e){setError(e instanceof Error?e.message:"账号加载失败。");}},[req]);
 useEffect(()=>{if(!profile)return;if(module==="dashboard")void loadDashboard();if(module==="customers")void loadCustomers();if(module==="products")void loadProducts();if(module==="quotes"){void loadQuotes();void loadCustomers();void loadProducts();}if(module==="orders")void loadOrders();if(module==="documents"){void loadDocs();void loadOrders();}if(module==="accounts"&&profile.role==="admin")void loadAccounts();if(module==="branding")void loadBranding();},[module,profile,loadDashboard,loadCustomers,loadProducts,loadQuotes,loadOrders,loadDocs,loadAccounts,loadBranding]);

 function beginEditCustomer(c:Customer){
  setCustomerEditDraft({company_name:c.company_name,contact_name:c.contact_name,email:c.email||"",phone:c.phone||"",whatsapp:c.whatsapp||"",website:c.website||"",address:c.address||"",country:c.country,city:c.city||"",notes:c.notes||"",tags:(c.tags||[]).join(", ")});
  setCustomerEditOpen(true);setError("");setNotice("");
 }
 async function saveCustomerEdit(e:React.FormEvent){
  e.preventDefault();if(!selected)return;
  setBusy(true);setError("");setNotice("");
  try{
   const patch={...customerEditDraft,email:customerEditDraft.email.trim()||null,phone:customerEditDraft.phone.trim()||null,whatsapp:customerEditDraft.whatsapp.trim()||null,website:customerEditDraft.website.trim()||null,address:customerEditDraft.address.trim()||null,city:customerEditDraft.city.trim()||null,notes:customerEditDraft.notes.trim()||null,tags:customerEditDraft.tags.split(",").map(x=>x.trim()).filter(Boolean)};
   await req("crm_customers?id=eq."+encodeURIComponent(selected.id),{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify(patch)});
   setCustomerEditOpen(false);setNotice("客户档案已更新。");await loadCustomers();await openCustomer({...selected,...patch});
  }catch(e){setError(e instanceof Error?e.message:"客户档案更新失败。");}
  finally{setBusy(false);}
 }
 async function deleteCustomer(){
  if(!selected||!window.confirm("确认删除该客户档案？如果客户已有报价或订单，系统会阻止删除以保护业务历史。"))return;
  setBusy(true);setError("");setNotice("");
  try{
   await req("crm_customers?id=eq."+encodeURIComponent(selected.id),{method:"DELETE",headers:{Prefer:"return=minimal"}});
   setSelected(null);setFollowups([]);setRelatedQuotes([]);setRelatedOrders([]);
   setNotice("客户档案已删除。");await loadCustomers();await loadDashboard();
  }catch(e){setError("客户未删除：可能已关联报价或订单。请保留客户档案并调整状态为“已流失”。详细信息："+(e instanceof Error?e.message:"删除失败"));}
  finally{setBusy(false);}
 }
 async function saveCustomer(e:React.FormEvent){e.preventDefault();setBusy(true);setError("");try{await req("crm_customers",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify({...customerDraft,owner_id:userId,status:"prospect",email:customerDraft.email.trim()||null,phone:customerDraft.phone.trim()||null,whatsapp:customerDraft.whatsapp.trim()||null,city:customerDraft.city.trim()||null,notes:customerDraft.notes.trim()||null,tags:customerDraft.tags.split(",").map(x=>x.trim()).filter(Boolean)})});setCustomerDraft({company_name:"",contact_name:"",email:"",phone:"",whatsapp:"",website:"",address:"",country:"",city:"",notes:"",tags:""});setCustomerOpen(false);setNotice("客户档案已保存。");await loadCustomers();await loadDashboard();}catch(e){setError(e instanceof Error?e.message:"保存客户失败。");}finally{setBusy(false);}}
 async function updateCustomer(patch:Partial<Customer>){if(!selected)return;setBusy(true);try{await req("crm_customers?id=eq."+encodeURIComponent(selected.id),{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify(patch)});setSelected({...selected,...patch});setNotice("客户信息已更新。");await loadCustomers();}catch(e){setError(e instanceof Error?e.message:"更新失败。");}finally{setBusy(false);}}
 async function openCustomer(row:Customer){
   setSelected(row);setCustomerEditOpen(false);setFollowups([]);setRelatedQuotes([]);setRelatedOrders([]);
   try{
    const [followupRows,quoteRows,orderRows]=await Promise.all([
     req<Followup[]>("crm_customer_followups?select=*&customer_id=eq."+encodeURIComponent(row.id)+"&order=followed_at.desc&limit=200"),
     req<Quote[]>("crm_quotes?select=id,quote_no,status,total_usd,total_cny,created_at&customer_id=eq."+encodeURIComponent(row.id)+"&order=created_at.desc&limit=200"),
     req<Order[]>("crm_orders?select=id,order_no,customer_id,status,total_usd,total_cny,order_date,expected_delivery_date,actual_delivery_date,delivery_progress,buyer_snapshot&customer_id=eq."+encodeURIComponent(row.id)+"&order=order_date.desc&limit=200")
    ]);
    setFollowups(followupRows);setRelatedQuotes(quoteRows);setRelatedOrders(orderRows);
   }catch(e){setError(e instanceof Error?e.message:"客户关联记录加载失败。");}
  }
 async function addFollowup(e:React.FormEvent){e.preventDefault();if(!selected)return;setBusy(true);try{await req("crm_customer_followups",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify({customer_id:selected.id,created_by:userId,method:followupDraft.method,summary:followupDraft.summary,followed_at:new Date().toISOString(),next_followup_at:followupDraft.next_followup_at?new Date(followupDraft.next_followup_at).toISOString():null})});await updateCustomer({last_contacted_at:new Date().toISOString(),next_followup_at:followupDraft.next_followup_at?new Date(followupDraft.next_followup_at).toISOString():null});setFollowupDraft({method:"email",summary:"",next_followup_at:""});await openCustomer(selected);setNotice("跟进记录已添加。");}catch(e){setError(e instanceof Error?e.message:"添加跟进记录失败。");}finally{setBusy(false);}}
 async function saveProduct(e:React.FormEvent){e.preventDefault();if(!profile)return;setBusy(true);setError("");try{const id=crypto.randomUUID();const factoryId=profile.role==="factory"?profile.factory_id:productDraft.factory_id;if(!factoryId)throw new Error("请先选择所属工厂，工厂账号自动使用本厂。");const product={id,slug:slug(productDraft.model_code||productDraft.name)||id,name:productDraft.name.trim(),model_code:productDraft.model_code.trim()||null,category:productDraft.category,factory_id:factoryId,published:false,hero_image:null,image:null,gallery:[],specs:[],features:[],specifications:{},certifications:[]};const prices={skd_price_usd:productDraft.skd_price_usd||null,skd_price_cny:productDraft.skd_price_cny||null,ckd_price_usd:productDraft.ckd_price_usd||null,ckd_price_cny:productDraft.ckd_price_cny||null,packing_quantity_40hq:productDraft.packing_quantity_40hq||null};if(!Object.values(prices).some(v=>v!==null))throw new Error("至少填写一项 SKD/CKD 价格或 40HQ 装箱量。");await req<string>("rpc/crm_create_product_with_prices",{method:"POST",body:JSON.stringify({p_product:product,p_prices:prices})});setProductOpen(false);setProductDraft({name:"",model_code:"",category:"electric-motorcycles",factory_id:"",skd_price_usd:"",skd_price_cny:"",ckd_price_usd:"",ckd_price_cny:"",packing_quantity_40hq:""});setNotice("产品与工厂价格已保存为内部草稿；价格存放在受权限保护的独立数据表。");await loadProducts();}catch(e){setError(e instanceof Error?e.message:"产品保存失败。");}finally{setBusy(false);}}
 async function createFactory(e:React.FormEvent){e.preventDefault();setBusy(true);setError("");try{await req("crm_factories",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify({...factoryDraft,status:"active"})});setFactoryDraft({factory_code:"",name:"",contact_name:"",email:"",phone:"",address:""});setFactoryOpen(false);setNotice("工厂档案已创建。现在可以为工厂分配账号并录入产品。");await loadProducts();}catch(e){setError(e instanceof Error?e.message:"工厂创建失败。");}finally{setBusy(false);}}
 async function adminAction(action:string,payload:Record<string,unknown>){const response=await fetch(API+"/functions/v1/crm-admin",{method:"POST",headers:{apikey:KEY,Authorization:"Bearer "+token,"Content-Type":"application/json"},body:JSON.stringify({action,...payload})});const data=await response.json() as {success?:boolean;data?:unknown;error?:string};if(!response.ok||!data.success)throw new Error(data.error||"管理员操作失败。");return data.data;}
 function beginEditAccount(a:Profile){
  setEditingAccount(a);
  setEditAccountDraft({username:a.username,email:a.email,full_name:a.full_name,role:a.role,factory_id:a.factory_id||""});
  setError("");setNotice("");
 }
 async function saveAccountEdit(e:React.FormEvent){
  e.preventDefault();if(!editingAccount)return;
  setBusy(true);setError("");setNotice("");
  try{await adminAction("update_user",{user_id:editingAccount.user_id,...editAccountDraft});setEditingAccount(null);setNotice("账户资料与角色已更新。若修改了登录邮箱，请使用新邮箱登录。");await loadAccounts();}
  catch(e){setError(e instanceof Error?e.message:"账户资料更新失败。");}
  finally{setBusy(false);}
 }
 async function uploadBrandingImage(file:File,kind:"logo"|"stamp"){
  if(!profile)throw new Error("登录状态已失效。");
  if(!["image/png","image/jpeg","image/webp"].includes(file.type))throw new Error("Logo/签章仅支持 PNG、JPG 或 WebP 图片。");
  if(file.size>5*1024*1024)throw new Error("单张图片不能超过 5 MB。");
  const ext=file.type==="image/jpeg"?"jpg":file.type==="image/webp"?"webp":"png";
  const folder=profile.role==="admin"?"company":`factory/${profile.factory_id}`;
  const path=`${folder}/${kind}-${Date.now()}.${ext}`;
  const response=await fetch(API+"/storage/v1/object/crm-branding/"+path,{method:"POST",headers:{apikey:KEY,Authorization:"Bearer "+token,"Content-Type":file.type,"x-upsert":"false"},body:file});
  if(!response.ok)throw new Error("图片上传失败："+await response.text());
  return API+"/storage/v1/object/public/crm-branding/"+path;
 }
 async function saveBranding(e:React.FormEvent){
  e.preventDefault();if(!profile)return;
  setBusy(true);setError("");setNotice("");
  try{
   const logo_url=brandingLogo?await uploadBrandingImage(brandingLogo,"logo"):brandingDraft.logo_url||null;
   const stamp_url=brandingStamp?await uploadBrandingImage(brandingStamp,"stamp"):brandingDraft.stamp_url||null;
   const scope=profile.role==="admin"?"company":"factory";
   const payload={scope,factory_id:scope==="factory"?profile.factory_id:null,logo_url,stamp_url,legal_name:brandingDraft.legal_name.trim()||null,address:brandingDraft.address.trim()||null,telephone:brandingDraft.telephone.trim()||null,email:brandingDraft.email.trim()||null,website:brandingDraft.website.trim()||null,bank_name:brandingDraft.bank_name.trim()||null,bank_address:brandingDraft.bank_address.trim()||null,beneficiary:brandingDraft.beneficiary.trim()||null,account_number:brandingDraft.account_number.trim()||null,swift_code:brandingDraft.swift_code.trim()||null,updated_by:userId};
   if(branding?.id)await req("crm_branding_settings?id=eq."+encodeURIComponent(branding.id),{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify(payload)});
   else await req("crm_branding_settings",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify(payload)});
   setNotice("Logo、签章与报价主体/银行资料已保存。");await loadBranding();
  }catch(e){setError(e instanceof Error?e.message:"报价单品牌设置保存失败。");}
  finally{setBusy(false);}
 }
 async function createAccount(e:React.FormEvent){e.preventDefault();setBusy(true);setError("");try{await adminAction("create_user",accountDraft);setAccountDraft({username:"",email:"",full_name:"",password:"",role:"sales",factory_id:""});setAccountOpen(false);setNotice("CRM 用户已创建，可以将账号和初始密码交付给对应人员。");await loadAccounts();}catch(e){setError(e instanceof Error?e.message:"账号创建失败。");}finally{setBusy(false);}}
 async function saveQuote(e:React.FormEvent){
  e.preventDefault();setBusy(true);setError("");setNotice("");
  try{
    const selectedCustomer=customers.find(x=>x.id===quoteCustomerId);
    if(!selectedCustomer) throw new Error("请先选择客户。");
    if(!quoteItems.length) throw new Error("报价至少需要一条产品明细。");
    const linesForRpc=quoteItems.map(line=>({product_id:line.product_id,price_basis:line.price_basis,quantity:Number(line.quantity)}));
    const factoryIds=[...new Set(quoteItems.map(line=>products.find(p=>p.id===line.product_id)?.factory_id).filter((x):x is string=>Boolean(x)))];
    let brandRows:Branding[]=[];
    if(factoryIds.length===1)brandRows=await req<Branding[]>("crm_branding_settings?select=*&scope=eq.factory&factory_id=eq."+encodeURIComponent(factoryIds[0])+"&limit=1");
    if(!brandRows.length)brandRows=await req<Branding[]>("crm_branding_settings?select=*&scope=eq.company&limit=1");
    const quoteBrand=brandRows[0]||null;
    const sellerSnapshot={
      company_name:quoteBrand?.legal_name||"YOUJIU",address:quoteBrand?.address||"",
      telephone:quoteBrand?.telephone||"",email:quoteBrand?.email||"",
      website:quoteBrand?.website||"https://www.almcp.com",
      bank_name:quoteBrand?.bank_name||"",bank_address:quoteBrand?.bank_address||"",
      beneficiary:quoteBrand?.beneficiary||"",account_number:quoteBrand?.account_number||"",
      swift_code:quoteBrand?.swift_code||""
    };
    const result=await req<{id:string;quote_no:string}>("rpc/crm_create_quote",{
      method:"POST",
      body:JSON.stringify({p_quote:{
        customer_id:quoteCustomerId,valid_until:quoteValidUntil||null,incoterm:quoteIncoterm,
        loading_port:quoteLoadingPort,destination_port:quoteDestinationPort,
        payment_terms:quotePaymentTerms,delivery_terms:quoteDeliveryTerms,remarks:quoteRemarks,
        seller_snapshot:sellerSnapshot,branding_snapshot:quoteBrand||{}
      },p_items:linesForRpc})
    });
    setQuoteOpen(false);setQuoteItems([]);setQuoteCustomerId("");setQuoteValidUntil("");
    setQuoteLoadingPort("");setQuoteDestinationPort("");setQuotePaymentTerms("");setQuoteDeliveryTerms("");setQuoteRemarks("");
    setNotice("报价单 "+result.quote_no+" 已保存为草稿。请检查后再发送给客户。");
    await loadQuotes();
  }catch(e){setError(e instanceof Error?e.message:"报价保存失败。");}
  finally{setBusy(false);}
}
async function openQuote(quote:Quote){
   setSelectedQuote(quote);setError("");setNotice("");
   setQuoteEditDraft({valid_until:quote.valid_until||"",incoterm:quote.incoterm||"FOB",loading_port:quote.loading_port||"",destination_port:quote.destination_port||"",payment_terms:quote.payment_terms||"",delivery_terms:quote.delivery_terms||"",packaging_terms:quote.packaging_terms||"",warranty_terms:quote.warranty_terms||"",remarks:quote.remarks||""});
   try{
    const [items,logs]=await Promise.all([
     req<QuoteItem[]>("crm_quote_items?select=*&quote_id=eq."+encodeURIComponent(quote.id)+"&order=line_no.asc&limit=500"),
     req<QuoteEmailLog[]>("crm_quote_email_logs?select=id,recipient,subject,method,sent_at,body,metadata&quote_id=eq."+encodeURIComponent(quote.id)+"&order=sent_at.desc&limit=100")
    ]);
    setQuoteDetailItems(items);setQuoteEmailLogs(logs);
   }catch(e){setError(e instanceof Error?e.message:"报价明细或邮件记录加载失败。");}
  }
  function updateQuoteDetailLine(id:string,key:"quantity"|"unit_price",value:string){
   setQuoteDetailItems(rows=>rows.map(row=>row.id===id?{...row,[key]:value===""?0:Number(value),line_total:(key==="quantity"?Number(value):Number(row.quantity))*(key==="unit_price"?Number(value):Number(row.unit_price))}:row));
  }
  async function saveQuoteDetail(e:React.FormEvent){
   e.preventDefault();if(!selectedQuote)return;
   if(quoteDetailItems.some(x=>Number(x.quantity)<=0||Number(x.unit_price)<0)){setError("报价明细数量必须大于零，单价不能小于零。");return;}
   setBusy(true);setError("");setNotice("");
   try{
    await req("crm_quotes?id=eq."+encodeURIComponent(selectedQuote.id),{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({
      valid_until:quoteEditDraft.valid_until||null,incoterm:quoteEditDraft.incoterm||null,
      loading_port:quoteEditDraft.loading_port||null,destination_port:quoteEditDraft.destination_port||null,
      payment_terms:quoteEditDraft.payment_terms||null,delivery_terms:quoteEditDraft.delivery_terms||null,
      packaging_terms:quoteEditDraft.packaging_terms||null,warranty_terms:quoteEditDraft.warranty_terms||null,
      remarks:quoteEditDraft.remarks||null
    })});
    await Promise.all(quoteDetailItems.map(item=>req("crm_quote_items?id=eq."+encodeURIComponent(item.id),{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({quantity:item.quantity,unit_price:item.unit_price,line_total:Number(item.quantity)*Number(item.unit_price)})})));
    const refreshed=await req<Quote[]>("crm_quotes?select=*&id=eq."+encodeURIComponent(selectedQuote.id)+"&limit=1");
    if(refreshed[0])await openQuote(refreshed[0]);
    await loadQuotes();setNotice("报价条款与明细已保存，双币种小计已自动重算。");
   }catch(e){setError(e instanceof Error?e.message:"报价修改失败。");}
   finally{setBusy(false);}
  }
  function previewQuotePdf(){
   if(!selectedQuote)return;
   const esc=(v:unknown)=>String(v??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]||ch));
   const brand=selectedQuote.branding_snapshot||{};
   const seller=selectedQuote.seller_snapshot||{};
   const buyer=selectedQuote.buyer_snapshot||{};
   const logo=String(brand.logo_url||"");const stamp=String(brand.stamp_url||"");
   const rows=quoteDetailItems.map(item=>"<tr><td>"+esc(item.line_no)+"</td><td>"+esc(item.model_code)+"</td><td>"+esc(item.product_name)+"<br><small>"+esc(item.description||"")+"</small></td><td>"+esc(item.price_basis.replace("_"," / "))+"</td><td class='num'>"+esc(item.quantity)+"</td><td class='num'>"+esc(Number(item.unit_price).toFixed(2))+"</td><td class='num'>"+esc(Number(item.line_total).toFixed(2))+"</td><td class='num'>"+esc(item.packing_quantity||"")+"</td></tr>").join("");
   const fields=[["Incoterms",selectedQuote.incoterm],["Validity",selectedQuote.valid_until],["Loading Port",selectedQuote.loading_port],["Destination Port",selectedQuote.destination_port],["Payment Terms",selectedQuote.payment_terms],["Delivery Terms",selectedQuote.delivery_terms],["Packaging",selectedQuote.packaging_terms],["Warranty",selectedQuote.warranty_terms]];
   let html="<!doctype html><html><head><meta charset='utf-8'><title>Quotation "+esc(selectedQuote.quote_no)+"</title><style>@page{size:A4;margin:13mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#18232d;font-size:10px;line-height:1.45}h1{font-size:24px;letter-spacing:.08em;margin:0}.top{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #263746;padding-bottom:12px}.top img{max-width:180px;max-height:60px;object-fit:contain}.meta{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:16px 0}.panel{border:1px solid #cbd5df;padding:10px;min-height:88px}.panel b{display:block;font-size:9px;color:#586779;text-transform:uppercase;margin-bottom:5px}.terms{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:12px 0}.field{border:1px solid #d7dfe7;padding:6px;min-height:28px}.field b{display:block;font-size:8px;color:#647282;text-transform:uppercase}table{width:100%;border-collapse:collapse;margin-top:12px}th{background:#e9eef2;text-align:left;font-size:8px;text-transform:uppercase}td,th{border:1px solid #cbd5df;padding:6px;vertical-align:top}.num{text-align:right;white-space:nowrap}.totals{text-align:right;font-size:12px;font-weight:bold;margin-top:10px;line-height:1.7}.bank{margin-top:14px;border:1px solid #cbd5df;padding:10px;line-height:1.6}.sign{display:flex;justify-content:flex-end;min-height:80px;margin-top:20px}.sign img{max-width:140px;max-height:78px;object-fit:contain}.footer{margin-top:18px;border-top:1px solid #ccd5dd;padding-top:7px;font-size:8px;color:#657382}</style></head><body>";
   html+="<div class='top'><div>"+(logo?"<img src='"+esc(logo)+"' alt='Logo'>":"<strong>"+esc(seller.company_name||"YOUJIU")+"</strong>")+"</div><div style='text-align:right'><h1>QUOTATION</h1><div><b>Quotation No.:</b> "+esc(selectedQuote.quote_no)+"</div><div><b>Date:</b> "+esc(new Date(selectedQuote.created_at).toLocaleDateString("en-GB"))+"</div><div><b>Valid Until:</b> "+esc(selectedQuote.valid_until||"—")+"</div></div></div>";
   html+="<div class='meta'><div class='panel'><b>Seller / Exporter</b><strong>"+esc(seller.company_name||"YOUJIU")+"</strong><div>"+esc(seller.address)+"</div><div>"+esc(seller.telephone)+" · "+esc(seller.email)+"</div><div>"+esc(seller.website)+"</div></div><div class='panel'><b>Buyer / Importer</b><strong>"+esc(buyer.company_name)+"</strong><div>"+esc(buyer.contact_name)+"</div><div>"+esc(buyer.address)+"</div><div>"+esc(buyer.country)+" · "+esc(buyer.city)+"</div><div>"+esc(buyer.email)+"</div></div></div>";
   html+="<div class='terms'>"+fields.map(([k,v])=>"<div class='field'><b>"+esc(k)+"</b>"+esc(v)+"</div>").join("")+"</div>";
   html+="<table><thead><tr><th>NO.</th><th>ITEM / MODEL</th><th>PRODUCT DESCRIPTION</th><th>PRICE BASIS</th><th class='num'>QTY</th><th class='num'>UNIT PRICE</th><th class='num'>AMOUNT</th><th class='num'>40HQ QTY</th></tr></thead><tbody>"+(rows||"<tr><td colspan='8'>No items</td></tr>")+"</tbody></table>";
   html+="<div class='totals'>TOTAL USD: "+esc(selectedQuote.total_usd)+"<br>TOTAL CNY: "+esc(selectedQuote.total_cny)+"</div>";
   html+="<div class='bank'><b>BANKING DETAILS</b><br>Bank Name: "+esc(seller.bank_name)+"<br>Bank Address: "+esc(seller.bank_address)+"<br>Beneficiary: "+esc(seller.beneficiary)+"<br>Account No.: "+esc(seller.account_number)+"<br>SWIFT: "+esc(seller.swift_code)+"</div>";
   html+="<div class='sign'>"+(stamp?"<img src='"+esc(stamp)+"' alt='Company Stamp'>":"<span>Authorized Signature / Company Stamp</span>")+"</div><div class='footer'>"+esc(seller.company_name||"YOUJIU")+" · "+esc(seller.website||"https://www.almcp.com")+" · This quotation is subject to the terms stated above.</div></body></html>";
   setQuotePreviewHtml(html);
   setQuotePreviewZoom(100);
   setQuotePreviewFullScreen(false);
   setQuotePreviewOpen(true);
  }
  async function createQuoteEmailDraft(){
   if(!selectedQuote)return;
   const recipient=String(selectedQuote.buyer_snapshot?.email||"").trim();
   if(!recipient){setError("该客户档案没有邮箱地址，请先编辑客户资料。");return;}
   const subject="Quotation "+selectedQuote.quote_no+" - "+String(selectedQuote.buyer_snapshot?.company_name||"");
   const body=[
    "Dear "+String(selectedQuote.buyer_snapshot?.contact_name||"Customer")+",","",
    "Please find our quotation "+selectedQuote.quote_no+" for your review.",
    "Total USD: "+cash(selectedQuote.total_usd,"USD"),
    "Total CNY: "+cash(selectedQuote.total_cny,"CNY"),
    "Incoterms: "+String(selectedQuote.incoterm||""),
    "Validity: "+String(selectedQuote.valid_until||""),
    "Payment Terms: "+String(selectedQuote.payment_terms||""),
    "","Please review the quotation PDF and let us know your comments.","",
    "Best regards,",String(selectedQuote.seller_snapshot?.company_name||"YOUJIU")
   ].join("\n");
   setBusy(true);setError("");
   try{
    await req("crm_quote_email_logs",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify({quote_id:selectedQuote.id,customer_id:selectedQuote.customer_id,logged_by:userId,recipient,subject,body,method:"email_client",sent_at:new Date().toISOString(),metadata:{delivery_confirmed:false,note:"Email draft opened in the user's mail client; actual sending is not confirmed."}})});
    const logs=await req<QuoteEmailLog[]>("crm_quote_email_logs?select=id,recipient,subject,method,sent_at,body,metadata&quote_id=eq."+encodeURIComponent(selectedQuote.id)+"&order=sent_at.desc&limit=100");
    setQuoteEmailLogs(logs);setNotice("已调起邮件客户端并记录邮件草稿。请在邮件客户端附上报价 PDF 后自行发送；CRM 不会把草稿标记为已送达。");
    window.location.href="mailto:"+encodeURIComponent(recipient)+"?subject="+encodeURIComponent(subject)+"&body="+encodeURIComponent(body);
   }catch(e){setError(e instanceof Error?e.message:"邮件草稿记录失败。");}
   finally{setBusy(false);}
  }
  async function convertQuote(id:string){
  setBusy(true);setError("");setNotice("");
  try{
    const orderId=await req<string>("rpc/crm_convert_quote_to_order",{method:"POST",body:JSON.stringify({p_quote_id:id})});
    setNotice("报价已成功转为订单。订单 ID："+String(orderId));
    await Promise.all([loadQuotes(),loadOrders()]);
  }catch(e){setError(e instanceof Error?e.message:"报价转订单失败。");}
  finally{setBusy(false);}
}
function addQuoteLine(){
  const product=products.find(p=>p.id===quoteLineDraft.product_id);
  const price=productPrices.find(p=>p.product_id===quoteLineDraft.product_id);
  if(!product||!price){setError("请选择已配置工厂价格的产品。");return;}
  const amount=price[quoteLineDraft.price_basis as keyof ProductPrice];
  if(amount===null||amount===undefined){setError("该产品未设置所选 SKD/CKD 价格。");return;}
  if(Number(quoteLineDraft.quantity)<=0){setError("数量必须大于零。");return;}
  setError("");
  setQuoteItems(v=>[...v,{id:crypto.randomUUID(),...quoteLineDraft}]);
  setQuoteLineDraft(v=>({...v,product_id:""}));
}


 async function changePassword(e:React.FormEvent){e.preventDefault();setError("");setNotice("");if(newPassword.length<8){setError("新密码至少需要 8 位。");return;}if(newPassword!==confirmPassword){setError("两次输入的新密码不一致。");return;}setBusy(true);try{const r=await fetch(API+"/auth/v1/user",{method:"PUT",headers:hdr(token),body:JSON.stringify({password:newPassword})});if(!r.ok)throw new Error(await r.text());setNewPassword("");setConfirmPassword("");setNotice("登录密码已修改。");}catch(e){setError(e instanceof Error?e.message:"密码修改失败。");}finally{setBusy(false);}}

 const filteredCustomers=useMemo(()=>customers.filter(c=>(statusFilter==="all"||c.status===statusFilter)&&(!search||[c.company_name,c.contact_name,c.email||"",c.country].join(" ").toLowerCase().includes(search.toLowerCase()))),[customers,statusFilter,search]);
 const filteredProducts=useMemo(()=>products.filter(p=>!productSearch||[p.name,p.model_code||"",p.category].join(" ").toLowerCase().includes(productSearch.toLowerCase())),[products,productSearch]);
 const menu:Array<{id:Module;label:string;icon:string;roles:Role[]}>=[
  {id:"dashboard",label:"销售看板",icon:"▦",roles:["admin","sales"]},
  {id:"customers",label:"客户与跟进",icon:"◎",roles:["admin","sales"]},
  {id:"products",label:"产品库",icon:"▣",roles:["admin","sales","factory"]},
  {id:"quotes",label:"报价单",icon:"▤",roles:["admin","sales"]},
  {id:"orders",label:"订单管理",icon:"▧",roles:["admin","sales"]},
  {id:"documents",label:"外贸单据 CI / PI / PL",icon:"▤",roles:["admin","sales"]},
  {id:"accounts",label:"账户管理",icon:"♙",roles:["admin"]},
  {id:"branding",label:"Logo 与签章",icon:"◇",roles:["admin","factory"]},
  {id:"password",label:"修改密码",icon:"⌑",roles:["admin","sales","factory"]}
 ];
 const filteredAccounts=useMemo(()=>accounts.filter(a=>(accountRoleFilter==="all"||a.role===accountRoleFilter)&&(!accountSearch||[a.username,a.full_name,a.email].join(" ").toLowerCase().includes(accountSearch.toLowerCase()))),[accounts,accountRoleFilter,accountSearch]);
 const pageTitle=menu.find(x=>x.id===module)?.label||"CRM";
 const go=(id:Module)=>{setModule(id);setDrawer(false);setError("");setNotice("");};

 if(!profile)return <main className="min-h-screen bg-[#f3f6f8] flex items-center justify-center p-5">
  <form onSubmit={login} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
   <div className="text-xs font-bold tracking-[.22em] text-emerald-700">YOUJIU BUSINESS SYSTEM</div>
   <h1 className="mt-3 text-2xl font-black text-slate-900">外贸 CRM 管理系统</h1>
   <p className="mt-2 text-sm text-slate-500">使用管理员分配的账号和密码登录</p>
   <label className="mt-6 block text-sm font-semibold">用户名 / 登录邮箱<input required type="text" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} placeholder="请输入管理员分配的用户名或邮箱" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-emerald-600"/></label>
   <label className="mt-4 block text-sm font-semibold">密码<input required type="password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-emerald-600"/></label>
   {error&&<p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
   {notice&&<p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}
   <button disabled={loading} className="mt-6 w-full rounded-lg bg-slate-900 px-4 py-3 font-bold text-white disabled:opacity-50">{loading?"正在登录…":"登录系统"}</button>
   <p className="mt-4 text-xs leading-5 text-slate-400">账号由系统管理员创建并分配角色；本系统不开放公开注册。</p>
  </form>
 </main>;

 const btn="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-50";
 const input="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600";
 const panel="rounded-xl border border-slate-200 bg-white p-4 sm:p-5";
 return <div className="min-h-screen bg-[#f3f6f8] text-slate-900">
  {drawer&&<button aria-label="关闭菜单遮罩" onClick={()=>setDrawer(false)} className="fixed inset-0 z-30 bg-black/40 lg:hidden"/>}
  <aside className={"fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-[#101923] text-white transition-transform lg:translate-x-0 "+(drawer?"translate-x-0":"-translate-x-full")}>
   <div className="flex h-16 items-center justify-between border-b border-white/10 px-5"><div><div className="font-black tracking-widest">YOUJIU</div><div className="text-[10px] tracking-[.2em] text-slate-400">TRADE CRM</div></div><button onClick={()=>setDrawer(false)} className="text-slate-400 lg:hidden">✕</button></div>
   <nav className="flex-1 space-y-1 overflow-y-auto p-3">{menu.filter(x=>profile.role&&x.roles.includes(profile.role)).map(item=><button key={item.id} onClick={()=>go(item.id)} className={"flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm "+(module===item.id?"bg-emerald-600 font-bold text-white":"text-slate-300 hover:bg-white/10")}><span className="w-5 text-center">{item.icon}</span>{item.label}</button>)}</nav>
   <div className="border-t border-white/10 p-4"><div className="text-sm font-semibold">{profile.full_name}</div><div className="mt-1 text-xs text-slate-400">{roleLabels[profile.role]}</div><button onClick={logout} className="mt-4 w-full rounded-lg border border-white/20 px-3 py-2 text-sm text-slate-200 hover:bg-white/10">退出登录</button></div>
  </aside>
  <div className="min-h-screen lg:pl-64">
   <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-7"><div className="flex items-center gap-3"><button onClick={()=>setDrawer(true)} className="rounded-lg border border-slate-200 px-3 py-2 lg:hidden">☰</button><div><div className="text-xs text-slate-400">YOUJIU / TRADE CRM</div><h1 className="font-bold">{pageTitle}</h1></div></div><div className="hidden text-right sm:block"><div className="text-sm font-semibold">{profile.full_name}</div><div className="text-xs text-slate-400">{profile.email}</div></div></header>
   <main className="mx-auto max-w-7xl space-y-5 p-4 sm:p-7">
    {error&&<div role="alert" className="whitespace-pre-wrap rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}<button onClick={()=>setError("")} className="float-right font-bold">×</button></div>}
    {notice&&<div role="status" className="whitespace-pre-wrap rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{notice}<button onClick={()=>setNotice("")} className="float-right font-bold">×</button></div>}

    {module==="dashboard"&&profile.role!=="factory"&&<div className="space-y-5">
     <div><h2 className="text-xl font-black">销售经营概览</h2><p className="mt-1 text-sm text-slate-500">统计范围由当前账号的数据权限自动控制；已取消订单不计入业绩。</p></div>
     <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {[["客户总数",kpis.customers.toLocaleString()],["成交客户",kpis.won.toLocaleString()],["订单数量",kpis.orders.toLocaleString()],["订单总额 USD",cash(kpis.usd,"USD")],["订单总额 CNY",cash(kpis.cny,"CNY")]].map(([l,v])=><div key={l} className={panel}><div className="text-xs text-slate-500">{l}</div><div className="mt-2 text-2xl font-black tabular-nums">{v}</div></div>)}
     </div>
     <div className={panel}><div className="mb-4 flex items-center justify-between"><h3 className="font-bold">销售人员业绩对比</h3><span className="text-xs text-slate-400">USD / CNY 分开统计</span></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{["业务员","订单 USD","订单 CNY","订单数","客户数","成交客户","转化率"].map(x=><th key={x} className="px-3 py-3">{x}</th>)}</tr></thead><tbody>{perf.map(p=><tr key={p.sales_user_id} className="border-t border-slate-100"><td className="px-3 py-3 font-semibold">{p.full_name} <span className="text-xs text-slate-400">({p.username})</span></td><td className="px-3 py-3">{cash(p.order_total_usd,"USD")}</td><td className="px-3 py-3">{cash(p.order_total_cny,"CNY")}</td><td className="px-3 py-3">{p.order_count}</td><td className="px-3 py-3">{p.customer_count}</td><td className="px-3 py-3">{p.won_customer_count}</td><td className="px-3 py-3 font-bold">{Number(p.conversion_rate).toFixed(2)}%</td></tr>)}{!perf.length&&<tr><td colSpan={7} className="px-3 py-10 text-center text-slate-400">暂无销售业绩数据</td></tr>}</tbody></table></div></div>
    </div>}

    {module==="customers"&&profile.role!=="factory"&&<div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-black">客户档案与跟进</h2><p className="mt-1 text-sm text-slate-500">维护客户资料、跟进时间线，并反查该客户关联的报价与订单。</p></div><button onClick={()=>setCustomerOpen(!customerOpen)} className={btn}>＋ 新建客户</button></div>
      {customerOpen&&<form onSubmit={saveCustomer} className={panel}><h3 className="mb-4 font-bold">新建客户档案</h3><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
       {([["company_name","公司名称",true],["contact_name","联系人",true],["email","邮箱",false],["phone","电话",false],["whatsapp","WhatsApp",false],["website","网站",false],["country","国家/地区",true],["city","城市",false],["address","详细地址",false],["tags","标签（逗号分隔）",false]] as [string,string,boolean][]).map(([k,l,reqd])=><label key={k} className="text-sm font-semibold">{l}<input required={Boolean(reqd)} className={input+" mt-1.5"} value={(customerDraft as Record<string,string>)[k]} onChange={e=>setCustomerDraft(v=>({...v,[k]:e.target.value}))}/></label>)}
       <label className="text-sm font-semibold sm:col-span-2 lg:col-span-3">备注<textarea className={input+" mt-1.5 min-h-20"} value={customerDraft.notes} onChange={e=>setCustomerDraft(v=>({...v,notes:e.target.value}))}/></label>
      </div><div className="mt-4 flex gap-2"><button disabled={busy} className={btn}>保存客户</button><button type="button" onClick={()=>setCustomerOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm">取消</button></div></form>}
      <div className={panel}><div className="mb-4 flex flex-wrap gap-2"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="搜索公司、联系人、邮箱或国家" className={input+" max-w-sm"}/><select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className={input+" max-w-44"}><option value="all">全部客户状态</option>{Object.entries({prospect:"潜在客户",following:"跟进中",won:"已成交",lost:"已流失"}).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select><button onClick={loadCustomers} className="rounded-lg border border-slate-300 px-3 text-sm">刷新</button></div>
       <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{["公司 / 联系人","国家/城市","邮箱 / 电话","状态","下次跟进","操作"].map(x=><th key={x} className="px-3 py-3">{x}</th>)}</tr></thead><tbody>
        {filteredCustomers.map(c=><tr key={c.id} className="border-t border-slate-100"><td className="px-3 py-3"><div className="font-bold">{c.company_name}</div><div className="mt-1 text-xs text-slate-500">{c.contact_name}</div></td><td className="px-3 py-3">{c.country}{c.city?", "+c.city:""}</td><td className="px-3 py-3"><div>{c.email||"—"}</div><div className="text-xs text-slate-500">{c.phone||c.whatsapp||"—"}</div></td><td className="px-3 py-3"><select value={c.status} onChange={e=>void req("crm_customers?id=eq."+encodeURIComponent(c.id),{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({status:e.target.value})}).then(()=>loadCustomers()).catch(x=>setError(String(x)))} className="rounded-md border border-slate-200 bg-white px-2 py-1">{Object.entries({prospect:"潜在客户",following:"跟进中",won:"已成交",lost:"已流失"}).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></td><td className="px-3 py-3">{d(c.next_followup_at)}</td><td className="px-3 py-3"><button onClick={()=>void openCustomer(c)} className="font-bold text-emerald-700">档案 / 跟进 →</button></td></tr>)}
        {!filteredCustomers.length&&<tr><td colSpan={6} className="px-3 py-10 text-center text-slate-400">{busy?"正在加载…":"暂无符合条件的客户"}</td></tr>}
       </tbody></table></div>
      </div>
      {selected&&<div className={panel}>
       <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg font-black">{selected.company_name}</h3><p className="text-sm text-slate-500">{selected.contact_name} · {selected.country}{selected.city?", "+selected.city:""}</p></div><div className="flex flex-wrap gap-2"><button onClick={()=>beginEditCustomer(selected)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">编辑客户资料</button><button onClick={()=>void deleteCustomer()} className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700">删除客户</button><button onClick={()=>setSelected(null)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">关闭</button></div></div>
       <div className="mt-3 flex flex-wrap gap-4 text-sm"><span>{selected.email||"无邮箱"}</span><span>{selected.phone||"无电话"}</span><span>{selected.whatsapp||"无 WhatsApp"}</span>{selected.website&&<a href={selected.website} target="_blank" rel="noreferrer" className="text-emerald-700 underline">{selected.website}</a>}</div>
       {customerEditOpen&&<form onSubmit={saveCustomerEdit} className="mt-5 rounded-lg bg-slate-50 p-4"><h4 className="font-bold">编辑客户档案</h4><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {([["company_name","公司名称",true],["contact_name","联系人",true],["email","邮箱",false],["phone","电话",false],["whatsapp","WhatsApp",false],["website","网站",false],["country","国家/地区",true],["city","城市",false],["address","详细地址",false],["tags","标签（逗号分隔）",false]] as [string,string,boolean][]).map(([k,l,reqd])=><label key={k} className="text-sm font-semibold">{l}<input required={Boolean(reqd)} className={input+" mt-1.5"} value={(customerEditDraft as Record<string,string>)[k]} onChange={e=>setCustomerEditDraft(v=>({...v,[k]:e.target.value}))}/></label>)}
        <label className="text-sm font-semibold sm:col-span-2 lg:col-span-3">备注<textarea className={input+" mt-1.5 min-h-20"} value={customerEditDraft.notes} onChange={e=>setCustomerEditDraft(v=>({...v,notes:e.target.value}))}/></label>
       </div><div className="mt-4 flex gap-2"><button disabled={busy} className={btn}>保存客户修改</button><button type="button" onClick={()=>setCustomerEditOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm">取消</button></div></form>}
       <div className="mt-5 flex flex-wrap items-center gap-2"><span className="text-sm font-semibold">客户状态</span><select value={selected.status} onChange={e=>void updateCustomer({status:e.target.value as Customer["status"]})} className="rounded-md border border-slate-300 px-3 py-2 text-sm">{Object.entries({prospect:"潜在客户",following:"跟进中",won:"已成交",lost:"已流失"}).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div>
       <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <form onSubmit={addFollowup} className="rounded-lg bg-slate-50 p-4"><h4 className="font-bold">新增跟进记录</h4><label className="mt-3 block text-sm">跟进方式<select value={followupDraft.method} onChange={e=>setFollowupDraft(v=>({...v,method:e.target.value}))} className={input+" mt-1"}>{["email","whatsapp","phone","video_call","meeting","trade_show","other"].map(x=><option key={x}>{x}</option>)}</select></label><label className="mt-3 block text-sm">跟进内容<textarea required minLength={2} value={followupDraft.summary} onChange={e=>setFollowupDraft(v=>({...v,summary:e.target.value}))} className={input+" mt-1 min-h-24"}/></label><label className="mt-3 block text-sm">下次跟进日期<input type="datetime-local" value={followupDraft.next_followup_at} onChange={e=>setFollowupDraft(v=>({...v,next_followup_at:e.target.value}))} className={input+" mt-1"}/></label><button disabled={busy} className={btn+" mt-3"}>保存跟进</button></form>
        <div><h4 className="font-bold">跟进时间线</h4><div className="mt-3 space-y-3">{followups.map(f=><div key={f.id} className="border-l-2 border-emerald-500 pl-3"><div className="flex justify-between gap-2 text-xs text-slate-400"><span>{f.method}</span><span>{new Date(f.followed_at).toLocaleString("zh-CN")}</span></div><p className="mt-1 whitespace-pre-wrap text-sm">{f.summary}</p>{f.next_followup_at&&<p className="mt-1 text-xs text-emerald-700">下次跟进：{new Date(f.next_followup_at).toLocaleString("zh-CN")}</p>}</div>)}{!followups.length&&<p className="text-sm text-slate-400">暂无跟进记录</p>}</div></div>
       </div>
       <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div><h4 className="font-bold">关联报价单</h4><div className="mt-3 space-y-2">{relatedQuotes.map(q=><div key={q.id} className="flex flex-wrap justify-between gap-2 rounded-lg border border-slate-200 p-3 text-sm"><span className="font-semibold">{q.quote_no} · {labels[q.status]||q.status}</span><span>{cash(q.total_usd,"USD")} / {cash(q.total_cny,"CNY")}</span></div>)}{!relatedQuotes.length&&<p className="text-sm text-slate-400">暂无关联报价。</p>}</div></div>
        <div><h4 className="font-bold">关联订单</h4><div className="mt-3 space-y-2">{relatedOrders.map(o=><div key={o.id} className="flex flex-wrap justify-between gap-2 rounded-lg border border-slate-200 p-3 text-sm"><span className="font-semibold">{o.order_no} · {labels[o.status]||o.status}</span><span>{cash(o.total_usd,"USD")} / {cash(o.total_cny,"CNY")}</span></div>)}{!relatedOrders.length&&<p className="text-sm text-slate-400">暂无关联订单。</p>}</div></div>
       </div>
      </div>}
     </div>}

    {module==="products"&&<div className="space-y-4">
     <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-black">产品库 / 工厂报价维护</h2><p className="mt-1 text-sm text-slate-500">工厂仅能维护本厂产品；销售员只读产品信息；管理员可管理全部产品。</p></div>{profile.role!=="sales"&&<button onClick={()=>setProductOpen(!productOpen)} className={btn}>＋ 新增产品</button>}</div>
     {productOpen&&<form onSubmit={saveProduct} className={panel}><h3 className="mb-4 font-bold">新增工厂产品</h3><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <label className="text-sm font-semibold">产品名称<input required className={input+" mt-1.5"} value={productDraft.name} onChange={e=>setProductDraft(v=>({...v,name:e.target.value}))}/></label><label className="text-sm font-semibold">ITEM 型号<input required className={input+" mt-1.5"} value={productDraft.model_code} onChange={e=>setProductDraft(v=>({...v,model_code:e.target.value}))}/></label><label className="text-sm font-semibold">产品分类<select className={input+" mt-1.5"} value={productDraft.category} onChange={e=>setProductDraft(v=>({...v,category:e.target.value}))}>{cats.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}</select></label>{profile.role==="admin"&&<label className="text-sm font-semibold">所属工厂<select required className={input+" mt-1.5"} value={productDraft.factory_id} onChange={e=>setProductDraft(v=>({...v,factory_id:e.target.value}))}><option value="">请选择工厂</option>{factories.filter(f=>f.status==="active").map(f=><option key={f.id} value={f.id}>{f.name} ({f.factory_code})</option>)}</select></label>}
      {([["skd_price_usd","SKD USD"],["skd_price_cny","SKD CNY"],["ckd_price_usd","CKD USD"],["ckd_price_cny","CKD CNY"],["packing_quantity_40hq","40HQ 装箱量"]] as const).map(([k,l])=><label key={k} className="text-sm font-semibold">{l}<input required type="number" min="0" step="0.01" className={input+" mt-1.5"} value={productDraft[k]} onChange={e=>setProductDraft(v=>({...v,[k]:e.target.value}))}/></label>)}
     </div><div className="mt-4 flex gap-2"><button disabled={busy} className={btn}>保存产品草稿</button><button type="button" onClick={()=>setProductOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm">取消</button></div><p className="mt-3 text-xs text-slate-500">本页面先录入报价主数据；图片、详细规格、自定义属性及发布审核会在产品管理下一阶段接入。未配置完整公开资料的产品不会自动发布到网站。</p></form>}
     <div className={panel}><div className="mb-4 flex gap-2"><input value={productSearch} onChange={e=>setProductSearch(e.target.value)} placeholder="按产品名称、型号或分类搜索" className={input+" max-w-sm"}/><button onClick={loadProducts} className="rounded-lg border border-slate-300 px-3 text-sm">刷新</button></div><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{["产品 / 型号","分类","SKD USD","SKD CNY","CKD USD","CKD CNY","40HQ","网站状态"].map(x=><th key={x} className="px-3 py-3">{x}</th>)}</tr></thead><tbody>{filteredProducts.map(p=>{const pr=productPrices.find(x=>x.product_id===p.id);return <tr key={p.id} className="border-t border-slate-100"><td className="px-3 py-3"><div className="font-bold">{p.name}</div><div className="text-xs text-slate-500">{p.model_code||p.slug}</div></td><td className="px-3 py-3">{cats.find(c=>c.value===p.category)?.label||p.category}</td><td className="px-3 py-3">{pr?.skd_price_usd==null?"—":cash(pr.skd_price_usd,"USD")}</td><td className="px-3 py-3">{pr?.skd_price_cny==null?"—":cash(pr.skd_price_cny,"CNY")}</td><td className="px-3 py-3">{pr?.ckd_price_usd==null?"—":cash(pr.ckd_price_usd,"USD")}</td><td className="px-3 py-3">{pr?.ckd_price_cny==null?"—":cash(pr.ckd_price_cny,"CNY")}</td><td className="px-3 py-3">{pr?.packing_quantity_40hq??"—"}</td><td className="px-3 py-3">{p.published?"已发布":"草稿"}</td></tr>})}{!filteredProducts.length&&<tr><td colSpan={8} className="px-3 py-10 text-center text-slate-400">{busy?"正在加载…":"暂无产品记录"}</td></tr>}</tbody></table></div></div>
    </div>}

    {module==="quotes"&&profile.role!=="factory"&&<div className="space-y-4">
     <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-black">报价单管理</h2><p className="mt-1 text-sm text-slate-500">从客户档案和工厂产品价格创建 SKD / CKD、多币种报价。草稿保存后可检查并继续推进。</p></div><button onClick={()=>{setQuoteOpen(!quoteOpen);setQuoteItems([]);setError("");}} disabled={!customers.length||!products.length} className={btn}>＋ 新建报价</button></div>
     {quoteOpen&&<form onSubmit={saveQuote} className={panel+" space-y-4"}>
      <h3 className="font-bold">新建英文报价单</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
       <label className="text-sm font-semibold">客户<select required value={quoteCustomerId} onChange={e=>setQuoteCustomerId(e.target.value)} className={input+" mt-1.5"}><option value="">请选择客户</option>{customers.map(x=><option key={x.id} value={x.id}>{x.company_name} · {x.country} · {x.contact_name}</option>)}</select></label>
       <label className="text-sm font-semibold">有效期至<input type="date" value={quoteValidUntil} onChange={e=>setQuoteValidUntil(e.target.value)} className={input+" mt-1.5"}/></label>
       <label className="text-sm font-semibold">贸易术语<select value={quoteIncoterm} onChange={e=>setQuoteIncoterm(e.target.value)} className={input+" mt-1.5"}>{["EXW","FOB","CFR","CIF","DAP","DDP"].map(x=><option key={x}>{x}</option>)}</select></label>
       <label className="text-sm font-semibold">装运港<input value={quoteLoadingPort} onChange={e=>setQuoteLoadingPort(e.target.value)} placeholder="e.g. Ningbo, China" className={input+" mt-1.5"}/></label>
       <label className="text-sm font-semibold">目的港<input value={quoteDestinationPort} onChange={e=>setQuoteDestinationPort(e.target.value)} placeholder="e.g. Karachi, Pakistan" className={input+" mt-1.5"}/></label>
       <label className="text-sm font-semibold">付款条件<input value={quotePaymentTerms} onChange={e=>setQuotePaymentTerms(e.target.value)} placeholder="e.g. 30% T/T deposit, balance before shipment" className={input+" mt-1.5"}/></label>
       <label className="text-sm font-semibold">交货条件<input value={quoteDeliveryTerms} onChange={e=>setQuoteDeliveryTerms(e.target.value)} className={input+" mt-1.5"}/></label>
       <label className="text-sm font-semibold sm:col-span-2">备注<textarea value={quoteRemarks} onChange={e=>setQuoteRemarks(e.target.value)} className={input+" mt-1.5 min-h-16"}/></label>
      </div>
      <div className="border-t border-slate-200 pt-4"><h4 className="font-bold">产品明细</h4><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
       <label className="text-sm">产品 / 型号<select value={quoteLineDraft.product_id} onChange={e=>setQuoteLineDraft(v=>({...v,product_id:e.target.value}))} className={input+" mt-1"}><option value="">请选择产品</option>{products.filter(p=>productPrices.some(pr=>pr.product_id===p.id)).map(p=><option key={p.id} value={p.id}>{p.name} · {p.model_code||p.slug}</option>)}</select></label>
       <label className="text-sm">报价类型<select value={quoteLineDraft.price_basis} onChange={e=>setQuoteLineDraft(v=>({...v,price_basis:e.target.value}))} className={input+" mt-1"}><option value="SKD_USD">SKD · USD</option><option value="SKD_CNY">SKD · CNY</option><option value="CKD_USD">CKD · USD</option><option value="CKD_CNY">CKD · CNY</option></select></label>
       <label className="text-sm">数量<input type="number" min="0.01" step="0.01" value={quoteLineDraft.quantity} onChange={e=>setQuoteLineDraft(v=>({...v,quantity:e.target.value}))} className={input+" mt-1"}/></label>
       <div className="flex items-end"><button type="button" onClick={addQuoteLine} className="w-full rounded-lg border border-emerald-700 px-4 py-2.5 text-sm font-bold text-emerald-800">添加产品明细</button></div>
      </div>
      <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{["产品","价格类型","数量","单价","小计",""].map(x=><th key={x} className="px-3 py-2.5">{x}</th>)}</tr></thead><tbody>{quoteItems.map(line=>{const product=products.find(p=>p.id===line.product_id);const price=productPrices.find(p=>p.product_id===line.product_id);const unit=price?Number((price as unknown as Record<string,number>)[line.price_basis]||0):0;const qty=Number(line.quantity);const currency=line.price_basis.endsWith("USD")?"USD":"CNY";return <tr key={line.id} className="border-t border-slate-100"><td className="px-3 py-3 font-semibold">{product?.name} <span className="text-xs text-slate-400">{product?.model_code}</span></td><td className="px-3 py-3">{line.price_basis.replace("_"," · ")}</td><td className="px-3 py-3">{qty}</td><td className="px-3 py-3">{cash(unit,currency)}</td><td className="px-3 py-3 font-bold">{cash(unit*qty,currency)}</td><td className="px-3 py-3"><button type="button" onClick={()=>setQuoteItems(v=>v.filter(x=>x.id!==line.id))} className="text-xs font-bold text-red-700">移除</button></td></tr>;})}{!quoteItems.length&&<tr><td colSpan={6} className="px-3 py-6 text-center text-slate-400">请添加至少一条报价产品</td></tr>}</tbody></table></div>
      <div className="flex flex-wrap justify-end gap-4 text-sm font-bold"><span>USD 小计：{cash(quoteItems.filter(x=>x.price_basis.endsWith("USD")).reduce((sum,x)=>{const p=productPrices.find(y=>y.product_id===x.product_id);return sum+Number((p as unknown as Record<string,number>)?.[x.price_basis]||0)*Number(x.quantity);},0),"USD")}</span><span>CNY 小计：{cash(quoteItems.filter(x=>x.price_basis.endsWith("CNY")).reduce((sum,x)=>{const p=productPrices.find(y=>y.product_id===x.product_id);return sum+Number((p as unknown as Record<string,number>)?.[x.price_basis]||0)*Number(x.quantity);},0),"CNY")}</span></div>
      </div>
      <div className="flex flex-wrap gap-2"><button disabled={busy||!quoteItems.length||!quoteCustomerId} className={btn}>{busy?"正在保存…":"保存报价草稿"}</button><button type="button" onClick={()=>setQuoteOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm">取消</button></div>
      <p className="text-xs text-slate-500">报价价格来自独立工厂价格表；保存时服务端重新读取对应价格，不接受浏览器传入的自定义单价。</p>
     </form>}
     <div className={panel}><div className="mb-4 flex items-center justify-between"><h3 className="font-bold">报价记录</h3><button onClick={loadQuotes} className="rounded-lg border border-slate-300 px-3 py-2 text-xs">刷新</button></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{["报价编号","状态","USD 总额","CNY 总额","创建日期","操作"].map(x=><th key={x} className="px-3 py-3">{x}</th>)}</tr></thead><tbody>{quotes.map(q=><tr key={q.id} className="border-t border-slate-100"><td className="px-3 py-3 font-bold">{q.quote_no}</td><td className="px-3 py-3">{labels[q.status]||q.status}</td><td className="px-3 py-3">{cash(q.total_usd,"USD")}</td><td className="px-3 py-3">{cash(q.total_cny,"CNY")}</td><td className="px-3 py-3">{d(q.created_at)}</td><td className="px-3 py-3"><div className="flex flex-wrap gap-2"><button onClick={()=>void req<Quote[]>("crm_quotes?select=*&id=eq."+encodeURIComponent(q.id)+"&limit=1").then(rows=>rows[0]&&openQuote(rows[0])).catch(e=>setError(e instanceof Error?e.message:"报价详情加载失败。"))} className="text-xs font-bold text-sky-700">详情 / 编辑</button>{!["converted","rejected","expired"].includes(q.status)&&<button disabled={busy} onClick={()=>void convertQuote(q.id)} className="text-xs font-bold text-emerald-700">转为订单 →</button>}</div></td></tr>)}{!quotes.length&&<tr><td colSpan={6} className="px-3 py-8 text-center text-slate-400">暂无报价记录</td></tr>}</tbody></table></div></div>
     {selectedQuote&&<form onSubmit={saveQuoteDetail} className={panel+" space-y-5"}>
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg font-black">报价详情 / 编辑：{selectedQuote.quote_no}</h3><p className="mt-1 text-sm text-slate-500">{String(selectedQuote.buyer_snapshot?.company_name||"")} · {String(selectedQuote.buyer_snapshot?.country||"")} · {labels[selectedQuote.status]||selectedQuote.status}</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={previewQuotePdf} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">英文预览 / 打印 / PDF</button><button type="button" disabled={busy} onClick={()=>void createQuoteEmailDraft()} className="rounded-lg border border-emerald-700 px-3 py-2 text-sm font-bold text-emerald-800">生成邮件草稿并记录</button><button type="button" onClick={()=>{setSelectedQuote(null);setQuoteDetailItems([]);setQuoteEmailLogs([]);}} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">关闭</button></div></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
       <label className="text-sm">报价有效期<input type="date" value={quoteEditDraft.valid_until} onChange={e=>setQuoteEditDraft(v=>({...v,valid_until:e.target.value}))} className={input+" mt-1"}/></label>
       <label className="text-sm">贸易术语<select value={quoteEditDraft.incoterm} onChange={e=>setQuoteEditDraft(v=>({...v,incoterm:e.target.value}))} className={input+" mt-1"}>{["EXW","FOB","CFR","CIF","DAP","DDP"].map(x=><option key={x}>{x}</option>)}</select></label>
       <label className="text-sm">装运港<input value={quoteEditDraft.loading_port} onChange={e=>setQuoteEditDraft(v=>({...v,loading_port:e.target.value}))} className={input+" mt-1"}/></label>
       <label className="text-sm">目的港<input value={quoteEditDraft.destination_port} onChange={e=>setQuoteEditDraft(v=>({...v,destination_port:e.target.value}))} className={input+" mt-1"}/></label>
       <label className="text-sm">付款条件<input value={quoteEditDraft.payment_terms} onChange={e=>setQuoteEditDraft(v=>({...v,payment_terms:e.target.value}))} className={input+" mt-1"}/></label>
       <label className="text-sm">交货条件<input value={quoteEditDraft.delivery_terms} onChange={e=>setQuoteEditDraft(v=>({...v,delivery_terms:e.target.value}))} className={input+" mt-1"}/></label>
       <label className="text-sm">包装条款<input value={quoteEditDraft.packaging_terms} onChange={e=>setQuoteEditDraft(v=>({...v,packaging_terms:e.target.value}))} className={input+" mt-1"}/></label>
       <label className="text-sm">质保条款<input value={quoteEditDraft.warranty_terms} onChange={e=>setQuoteEditDraft(v=>({...v,warranty_terms:e.target.value}))} className={input+" mt-1"}/></label>
       <label className="text-sm sm:col-span-2 lg:col-span-3">备注<textarea value={quoteEditDraft.remarks} onChange={e=>setQuoteEditDraft(v=>({...v,remarks:e.target.value}))} className={input+" mt-1 min-h-20"}/></label>
      </div>
      <div><h4 className="font-bold">报价产品明细（可编辑数量与销售单价）</h4><div className="mt-3 overflow-x-auto"><table className="w-full min-w-[950px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{["型号","产品名称","报价方式","数量","单价","小计","40HQ装箱量"].map(x=><th key={x} className="px-3 py-3">{x}</th>)}</tr></thead><tbody>
       {quoteDetailItems.map(item=><tr key={item.id} className="border-t border-slate-100"><td className="px-3 py-3 font-semibold">{item.model_code||"—"}</td><td className="px-3 py-3">{item.product_name}<div className="text-xs text-slate-400">{item.description||""}</div></td><td className="px-3 py-3">{item.price_basis.replace("_"," · ")}</td><td className="px-2 py-2"><input type="number" min="0.01" step="0.01" value={item.quantity} onChange={e=>updateQuoteDetailLine(item.id,"quantity",e.target.value)} className="w-24 rounded border border-slate-200 px-2 py-2"/></td><td className="px-2 py-2"><input type="number" min="0" step="0.01" value={item.unit_price} onChange={e=>updateQuoteDetailLine(item.id,"unit_price",e.target.value)} className="w-28 rounded border border-slate-200 px-2 py-2"/></td><td className="px-3 py-3 font-bold">{cash(Number(item.quantity)*Number(item.unit_price),item.price_basis.endsWith("USD")?"USD":"CNY")}</td><td className="px-3 py-3">{item.packing_quantity??"—"}</td></tr>)}
      </tbody></table></div></div>
      <div className="flex flex-wrap justify-end gap-4 text-sm font-bold"><span>USD 总额：{cash(quoteDetailItems.filter(x=>x.price_basis.endsWith("USD")).reduce((a,x)=>a+Number(x.quantity)*Number(x.unit_price),0),"USD")}</span><span>CNY 总额：{cash(quoteDetailItems.filter(x=>x.price_basis.endsWith("CNY")).reduce((a,x)=>a+Number(x.quantity)*Number(x.unit_price),0),"CNY")}</span></div>
      <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4"><button disabled={busy} className={btn}>{busy?"正在保存…":"保存报价修改"}</button><span className="self-center text-xs text-slate-500">金额按 USD/CNY 独立汇总；保存后报价编号不变。</span></div>
      <div className="border-t border-slate-200 pt-4"><h4 className="font-bold">邮件发送 / 草稿记录</h4><p className="mt-1 text-xs text-slate-500">“生成邮件草稿”会调用本机默认邮件客户端，并记录草稿生成行为；CRM 无法确认邮件是否真正发送或送达。请手动附上已导出的报价 PDF。</p>
       <div className="mt-3 space-y-2">{quoteEmailLogs.map(log=><div key={log.id} className="rounded-lg border border-slate-200 p-3 text-sm"><div className="flex flex-wrap justify-between gap-2"><b>{log.subject}</b><span className="text-xs text-slate-400">{new Date(log.sent_at).toLocaleString("zh-CN")}</span></div><div className="mt-1 text-slate-600">收件人：{log.recipient} · 方式：{log.method==="email_client"?"邮件客户端草稿":"其他记录"}</div><div className="mt-1 text-xs text-amber-700">草稿已记录；实际发送状态未确认。</div></div>)}{!quoteEmailLogs.length&&<p className="text-sm text-slate-400">暂无邮件草稿/发送记录。</p>}</div>
      </div>
     </form>}
     {quotePreviewOpen&&<div className="fixed inset-0 z-[70] bg-slate-950/75 p-2 sm:p-5" role="dialog" aria-modal="true" aria-label="英文报价单预览">
      <div className={"mx-auto flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-2xl "+(quotePreviewFullScreen?"w-full":"max-w-6xl")}>
       <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-3 py-3 sm:px-5">
        <div><div className="font-bold">英文报价单预览</div><div className="text-xs text-slate-500">{selectedQuote?.quote_no||""} · 缩放 {quotePreviewZoom}%</div></div>
        <div className="flex flex-wrap items-center gap-2">
         <label className="flex items-center gap-2 text-xs text-slate-600">缩放
          <input aria-label="预览缩放" type="range" min="50" max="300" step="5" value={quotePreviewZoom} onChange={e=>setQuotePreviewZoom(Number(e.target.value))} className="w-28"/>
         </label>
         <button type="button" onClick={()=>setQuotePreviewZoom(100)} className="rounded border px-2 py-1.5 text-xs">实际大小</button>
         <button type="button" onClick={()=>setQuotePreviewZoom(75)} className="rounded border px-2 py-1.5 text-xs">适合宽度</button>
         <button type="button" onClick={()=>setQuotePreviewFullScreen(v=>!v)} className="rounded border px-2 py-1.5 text-xs">{quotePreviewFullScreen?"退出全屏":"全屏"}</button>
         <button type="button" onClick={()=>quotePreviewFrame.current?.contentWindow?.print()} className="rounded bg-slate-900 px-3 py-1.5 text-xs font-bold text-white">打印 / 保存 PDF</button>
         <button type="button" onClick={()=>setQuotePreviewOpen(false)} className="rounded border px-3 py-1.5 text-xs">关闭</button>
        </div>
       </div>
       <div className="min-h-0 flex-1 overflow-auto bg-slate-200 p-2 sm:p-4">
        <div className="mx-auto bg-white shadow-lg" style={{width:(10000/quotePreviewZoom)+"%",height:"calc(100vh - 145px)",transform:"scale("+(quotePreviewZoom/100)+")",transformOrigin:"top left"}}>
         <iframe ref={quotePreviewFrame} title="Quotation PDF preview" srcDoc={quotePreviewHtml} className="h-full w-full border-0 bg-white"/>
        </div>
       </div>
      </div>
     </div>}
    </div>}{module==="orders"&&profile.role!=="factory"&&<div className="space-y-4">
     <div className={panel}>
      <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-xl font-black">订单管理</h2><p className="mt-2 text-sm text-slate-500">从报价转入的订单在此维护状态、预计交付日期、实际交付日期及进度历史。</p></div><button onClick={loadOrders} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">刷新订单</button></div>
      <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[880px] text-left text-sm">
       <thead className="bg-slate-50 text-xs text-slate-500"><tr>{["订单编号","客户","状态","USD 总额","CNY 总额","订单日期","预计交付","操作"].map(x=><th key={x} className="px-3 py-3">{x}</th>)}</tr></thead>
       <tbody>{orders.map(o=><tr key={o.id} className="border-t border-slate-100">
        <td className="px-3 py-3 font-bold">{o.order_no}</td><td className="px-3 py-3">{o.buyer_snapshot?.company_name||"—"}<div className="text-xs text-slate-400">{o.buyer_snapshot?.country||""}</div></td>
        <td className="px-3 py-3">{labels[o.status]||o.status}</td><td className="px-3 py-3">{cash(o.total_usd,"USD")}</td><td className="px-3 py-3">{cash(o.total_cny,"CNY")}</td>
        <td className="px-3 py-3">{d(o.order_date)}</td><td className="px-3 py-3">{d(o.expected_delivery_date)}</td>
        <td className="px-3 py-3"><button onClick={()=>void openOrder(o)} className="text-xs font-bold text-emerald-700">查看 / 更新进度 →</button></td>
       </tr>)}
       {!orders.length&&<tr><td colSpan={8} className="px-3 py-8 text-center text-slate-400">暂无订单。可先在报价单中将有效报价转为订单。</td></tr>}
       </tbody>
      </table></div>
     </div>
     {selectedOrder&&<div className={panel}>
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg font-black">{selectedOrder.order_no}</h3><p className="mt-1 text-sm text-slate-500">{selectedOrder.buyer_snapshot?.company_name||"客户信息"} · {labels[selectedOrder.status]||selectedOrder.status}</p></div><button onClick={()=>setSelectedOrder(null)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">关闭详情</button></div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
       <div className="rounded-lg bg-slate-50 p-3"><div className="text-xs text-slate-500">USD 金额</div><div className="mt-1 font-black">{cash(selectedOrder.total_usd,"USD")}</div></div>
       <div className="rounded-lg bg-slate-50 p-3"><div className="text-xs text-slate-500">CNY 金额</div><div className="mt-1 font-black">{cash(selectedOrder.total_cny,"CNY")}</div></div>
       <div className="rounded-lg bg-slate-50 p-3"><div className="text-xs text-slate-500">订单日期</div><div className="mt-1 font-bold">{d(selectedOrder.order_date)}</div></div>
       <div className="rounded-lg bg-slate-50 p-3"><div className="text-xs text-slate-500">实际交付日期</div><div className="mt-1 font-bold">{d(selectedOrder.actual_delivery_date)}</div></div>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
       <form onSubmit={saveOrderProgress} className="rounded-lg bg-slate-50 p-4">
        <h4 className="font-bold">更新订单状态与交付进度</h4>
        <label className="mt-3 block text-sm">订单状态<select value={orderDraft.status} onChange={e=>setOrderDraft(v=>({...v,status:e.target.value}))} className={input+" mt-1"}>{["quoted","ordered","production","shipped","completed","cancelled"].map(x=><option key={x} value={x}>{labels[x]||x}</option>)}</select></label>
        <label className="mt-3 block text-sm">本次进度说明<textarea required value={orderDraft.progress_description} onChange={e=>setOrderDraft(v=>({...v,progress_description:e.target.value}))} placeholder="例如：Production started; 30% completed." className={input+" mt-1 min-h-24"}/></label>
        <div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-sm">预计交付日期<input type="date" value={orderDraft.expected_delivery_date} onChange={e=>setOrderDraft(v=>({...v,expected_delivery_date:e.target.value}))} className={input+" mt-1"}/></label><label className="text-sm">实际交付日期<input type="date" value={orderDraft.actual_delivery_date} onChange={e=>setOrderDraft(v=>({...v,actual_delivery_date:e.target.value}))} className={input+" mt-1"}/></label></div>
        <button disabled={busy} className={btn+" mt-4"}>{busy?"正在保存…":"保存订单进度"}</button>
       </form>
       <div><h4 className="font-bold">交付进度时间线</h4><div className="mt-3 space-y-3">{orderUpdates.map(u=><div key={u.id} className="border-l-2 border-emerald-500 pl-3"><div className="flex flex-wrap justify-between gap-2 text-xs text-slate-400"><span>{u.status?labels[u.status]||u.status:"进度更新"}</span><span>{new Date(u.created_at).toLocaleString("zh-CN")}</span></div><p className="mt-1 whitespace-pre-wrap text-sm">{u.progress_description}</p>{u.expected_delivery_date&&<p className="mt-1 text-xs text-slate-500">预计交付：{d(u.expected_delivery_date)}</p>}{u.actual_delivery_date&&<p className="mt-1 text-xs text-emerald-700">实际交付：{d(u.actual_delivery_date)}</p>}</div>)}{!orderUpdates.length&&<p className="text-sm text-slate-400">暂无进度记录。</p>}</div></div>
      </div>
     </div>}
    </div>}

    {module==="documents"&&profile.role!=="factory"&&<div className="space-y-4">
      <div className={panel}>
       <div><h2 className="text-xl font-black">外贸单据管理（CI / PI / PL）</h2><p className="mt-2 text-sm text-slate-500">从订单快照生成英文商业发票、形式发票与装箱单；单据与订单独立，允许编辑、重置和打印保存为 PDF。</p></div>
       <div className="mt-4 flex flex-wrap items-end gap-2">
        <label className="min-w-[280px] flex-1 text-sm">选择订单<select value={docOrderId} onChange={e=>setDocOrderId(e.target.value)} className={input+" mt-1"}><option value="">请选择要生成单据的订单</option>{orders.map(o=><option key={o.id} value={o.id}>{o.order_no} · {o.buyer_snapshot?.company_name||"Customer"} · {cash(o.total_usd,"USD")}</option>)}</select></label>
        <button disabled={busy||!docOrderId} onClick={()=>void createTradeDocument("CI")} className={btn}>生成 CI</button>
        <button disabled={busy||!docOrderId} onClick={()=>void createTradeDocument("PI")} className={btn}>生成 PI</button>
        <button disabled={busy||!docOrderId} onClick={()=>void createTradeDocument("PL")} className={btn}>生成 PL</button>
       </div>
      </div>
      <div className={panel}>
       <div className="mb-4 flex items-center justify-between gap-3"><h3 className="font-bold">单据列表</h3><button onClick={loadDocs} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">刷新</button></div>
       <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{["类型","单据编号","订单编号","状态","日期","操作"].map(x=><th key={x} className="px-3 py-3">{x}</th>)}</tr></thead><tbody>
        {docs.map(x=><tr key={x.id} className="border-t border-slate-100"><td className="px-3 py-3 font-bold">{x.document_type}</td><td className="px-3 py-3">{x.document_no}</td><td className="px-3 py-3">{String(x.order_snapshot?.order_no||x.order_id)}</td><td className="px-3 py-3">{labels[x.status]||x.status}</td><td className="px-3 py-3">{d(x.document_date)}</td><td className="px-3 py-3"><button onClick={()=>void openTradeDocument(x)} className="font-bold text-emerald-700">编辑 / 预览 →</button></td></tr>)}
        {!docs.length&&<tr><td colSpan={6} className="px-3 py-8 text-center text-slate-400">暂无外贸单据。请先从上方选择订单生成。</td></tr>}
       </tbody></table></div>
      </div>
      {selectedDoc&&<form onSubmit={saveTradeDocument} className={panel+" space-y-5"}>
       <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg font-black">{selectedDoc.document_type==="CI"?"商业发票 Commercial Invoice":selectedDoc.document_type==="PI"?"形式发票 Proforma Invoice":"装箱单 Packing List"}</h3><p className="mt-1 text-sm text-slate-500">来源订单：{String(selectedDoc.order_snapshot?.order_no||selectedDoc.order_id)} · {labels[selectedDoc.status]||selectedDoc.status}</p></div><button type="button" onClick={()=>setSelectedDoc(null)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">关闭编辑</button></div>
       <div><h4 className="font-bold">一、单据基本信息</h4><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm">单据编号<input required value={docDraft.document_no} onChange={e=>setDocDraft(v=>({...v,document_no:e.target.value}))} className={input+" mt-1"}/></label>
        <label className="text-sm">单据日期<input required type="date" value={docDraft.document_date} onChange={e=>setDocDraft(v=>({...v,document_date:e.target.value}))} className={input+" mt-1"}/></label>
        <label className="text-sm">合同/订单号<input value={docDraft.contract_no} onChange={e=>setDocDraft(v=>({...v,contract_no:e.target.value}))} className={input+" mt-1"}/></label>
        <label className="text-sm">运输唛头<input value={docDraft.shipping_marks} onChange={e=>setDocDraft(v=>({...v,shipping_marks:e.target.value}))} className={input+" mt-1"}/></label>
       </div></div>
       <div><h4 className="font-bold">二、贸易条款与银行相关条款</h4><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-sm">贸易术语<input value={docDraft.incoterm} onChange={e=>setDocDraft(v=>({...v,incoterm:e.target.value}))} className={input+" mt-1"}/></label>
        <label className="text-sm">付款方式<input value={docDraft.payment_terms} onChange={e=>setDocDraft(v=>({...v,payment_terms:e.target.value}))} className={input+" mt-1"}/></label>
        <label className="text-sm">原产国<input value={docDraft.origin} onChange={e=>setDocDraft(v=>({...v,origin:e.target.value}))} className={input+" mt-1"}/></label>
        <label className="text-sm sm:col-span-2 lg:col-span-3">备注<textarea value={docDraft.remarks} onChange={e=>setDocDraft(v=>({...v,remarks:e.target.value}))} className={input+" mt-1 min-h-16"}/></label>
       </div></div>
       <div><h4 className="font-bold">三、运输与包装信息</h4><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {([["loading_port","装运港"],["destination_port","目的港"],["container_no","集装箱号"],["seal_no","封条号"],["shipping_date","装船日期"],["package_count","总箱数/包装件数"],["gross_weight","毛重（KGS）"],["net_weight","净重（KGS）"],["volume","体积（CBM）"]] as [string,string][]).map(([k,l])=><label key={k} className="text-sm">{l}<input value={(docDraft as Record<string,string>)[k]} onChange={e=>setDocDraft(v=>({...v,[k]:e.target.value}))} className={input+" mt-1"}/></label>)}
       </div></div>
       <div><h4 className="font-bold">四、产品明细（可编辑）</h4><div className="mt-3 overflow-x-auto"><table className="w-full min-w-[1350px] text-left text-xs"><thead className="bg-slate-50 text-slate-500"><tr>{["ITEM / Model","Product Name","Description","Qty","Unit Price","Amount","Packing / 40HQ","G.W.","N.W.","CBM"].map(x=><th key={x} className="px-2 py-2">{x}</th>)}</tr></thead><tbody>
        {docItems.map(item=><tr key={item.id} className="border-t border-slate-100">
         <td className="p-1"><input value={String(item.item_fields.model_code||"")} onChange={e=>updateDocItem(item.id,"model_code",e.target.value)} className="w-28 rounded border border-slate-200 px-2 py-2"/></td>
         <td className="p-1"><input value={String(item.item_fields.product_name||"")} onChange={e=>updateDocItem(item.id,"product_name",e.target.value)} className="w-40 rounded border border-slate-200 px-2 py-2"/></td>
         <td className="p-1"><input value={String(item.item_fields.description||"")} onChange={e=>updateDocItem(item.id,"description",e.target.value)} className="w-44 rounded border border-slate-200 px-2 py-2"/></td>
         <td className="p-1"><input type="number" min="0" step="0.01" value={String(item.item_fields.quantity??"")} onChange={e=>updateDocItem(item.id,"quantity",e.target.value)} className="w-20 rounded border border-slate-200 px-2 py-2"/></td>
         <td className="p-1"><input type="number" min="0" step="0.01" value={String(item.item_fields.unit_price??"")} onChange={e=>updateDocItem(item.id,"unit_price",e.target.value)} className="w-24 rounded border border-slate-200 px-2 py-2"/></td>
         <td className="p-1"><input value={String(item.item_fields.line_total??"")} readOnly className="w-24 rounded border border-slate-100 bg-slate-50 px-2 py-2"/></td>
         <td className="p-1"><input type="number" min="0" step="1" value={String(item.item_fields.packing_quantity_40hq??"")} onChange={e=>updateDocItem(item.id,"packing_quantity_40hq",e.target.value)} className="w-24 rounded border border-slate-200 px-2 py-2"/></td>
         {(["gross_weight","net_weight","volume"] as string[]).map(k=><td key={k} className="p-1"><input value={String(item.item_fields[k]??"")} onChange={e=>updateDocItem(item.id,k,e.target.value)} className="w-20 rounded border border-slate-200 px-2 py-2"/></td>)}
        </tr>)}
        {!docItems.length&&<tr><td colSpan={10} className="px-3 py-6 text-center text-slate-400">该订单暂无产品明细。</td></tr>}
       </tbody></table></div></div>
       <div><h4 className="font-bold">五、声明与签署</h4><textarea value={docDraft.declaration} onChange={e=>setDocDraft(v=>({...v,declaration:e.target.value}))} className={input+" mt-3 min-h-20 w-full"}/><div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">{Boolean(selectedDoc.branding_snapshot?.logo_url)&&<span>已套用 Logo</span>}{Boolean(selectedDoc.branding_snapshot?.stamp_url)&&<span>已套用签章</span>}{!Boolean(selectedDoc.branding_snapshot?.logo_url)&&!Boolean(selectedDoc.branding_snapshot?.stamp_url)&&<span>暂无品牌图片，将使用文字抬头和签署区域</span>}</div></div>
       <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4"><button disabled={busy} className={btn}>保存单据</button><button type="button" disabled={busy} onClick={()=>void resetTradeDocument()} className="rounded-lg border border-amber-300 px-4 py-2.5 text-sm text-amber-800">按订单数据重置</button><button type="button" onClick={previewTradeDocument} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm">预览 / 打印 / 保存 PDF</button></div>
      </form>}
     </div>}

    {module==="accounts"&&profile.role==="admin"&&<div className="space-y-4">
     <div className={panel}>
      <div className="flex flex-wrap items-start justify-between gap-3">
       <div><h2 className="text-xl font-black">账户与角色管理</h2><p className="mt-2 text-sm text-slate-500">管理用户生命周期：创建、编辑、角色与工厂分配、启用/禁用、重置密码及删除。</p></div>
       <div className="flex gap-2"><button onClick={()=>{setAccountOpen(!accountOpen);setEditingAccount(null);}} className={btn}>＋ 新建用户</button><button onClick={loadAccounts} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">刷新</button></div>
      </div>
      <div className="mt-5 border-t border-slate-200 pt-5">
       <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-bold">工厂档案</h3><p className="mt-1 text-xs text-slate-500">先建立工厂资料，再将工厂用户绑定到对应工厂。</p></div><button onClick={()=>setFactoryOpen(!factoryOpen)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">＋ 新建工厂</button></div>
       {factoryOpen&&<form onSubmit={createFactory} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-sm">工厂代码<input required value={factoryDraft.factory_code} onChange={e=>setFactoryDraft(v=>({...v,factory_code:e.target.value.toUpperCase()}))} className={input+" mt-1"}/></label>
        <label className="text-sm">工厂名称<input required value={factoryDraft.name} onChange={e=>setFactoryDraft(v=>({...v,name:e.target.value}))} className={input+" mt-1"}/></label>
        <label className="text-sm">联系人<input value={factoryDraft.contact_name} onChange={e=>setFactoryDraft(v=>({...v,contact_name:e.target.value}))} className={input+" mt-1"}/></label>
        <label className="text-sm">邮箱<input type="email" value={factoryDraft.email} onChange={e=>setFactoryDraft(v=>({...v,email:e.target.value}))} className={input+" mt-1"}/></label>
        <label className="text-sm">电话<input value={factoryDraft.phone} onChange={e=>setFactoryDraft(v=>({...v,phone:e.target.value}))} className={input+" mt-1"}/></label>
        <label className="text-sm">地址<input value={factoryDraft.address} onChange={e=>setFactoryDraft(v=>({...v,address:e.target.value}))} className={input+" mt-1"}/></label>
        <div className="sm:col-span-2 lg:col-span-3"><button disabled={busy} className={btn}>保存工厂</button></div>
       </form>}
       <div className="mt-3 flex flex-wrap gap-2">{factories.map(f=><span key={f.id} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs">{f.name} · {f.factory_code} · {labels[f.status]||f.status}</span>)}</div>
      </div>
      {accountOpen&&<form onSubmit={createAccount} className="mt-5 border-t border-slate-200 pt-5">
       <h3 className="font-bold">创建 CRM 用户</h3>
       <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-sm">用户名<input required value={accountDraft.username} onChange={e=>setAccountDraft(v=>({...v,username:e.target.value.toLowerCase()}))} className={input+" mt-1"}/></label>
        <label className="text-sm">姓名<input required value={accountDraft.full_name} onChange={e=>setAccountDraft(v=>({...v,full_name:e.target.value}))} className={input+" mt-1"}/></label>
        <label className="text-sm">登录邮箱<input required type="email" value={accountDraft.email} onChange={e=>setAccountDraft(v=>({...v,email:e.target.value}))} className={input+" mt-1"}/></label>
        <label className="text-sm">初始密码（至少10位）<input required minLength={10} type="password" value={accountDraft.password} onChange={e=>setAccountDraft(v=>({...v,password:e.target.value}))} className={input+" mt-1"}/></label>
        <label className="text-sm">角色<select value={accountDraft.role} onChange={e=>setAccountDraft(v=>({...v,role:e.target.value,factory_id:e.target.value==="factory"?v.factory_id:""}))} className={input+" mt-1"}><option value="sales">销售员</option><option value="factory">工厂用户</option><option value="admin">管理员</option></select></label>
        {accountDraft.role==="factory"&&<label className="text-sm">所属工厂<select required value={accountDraft.factory_id} onChange={e=>setAccountDraft(v=>({...v,factory_id:e.target.value}))} className={input+" mt-1"}><option value="">请选择工厂</option>{factories.filter(f=>f.status==="active").map(f=><option key={f.id} value={f.id}>{f.name} · {f.factory_code}</option>)}</select></label>}
       </div>
       <div className="mt-4 flex gap-2"><button disabled={busy} className={btn}>创建用户</button><button type="button" onClick={()=>setAccountOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm">取消</button></div>
       <p className="mt-2 text-xs text-slate-500">通过服务端 Supabase Auth Admin API 创建用户；服务端密钥不会发送到浏览器。</p>
      </form>}
      {editingAccount&&<form onSubmit={saveAccountEdit} className="mt-5 border-t border-slate-200 pt-5">
       <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold">编辑账户：{editingAccount.username}</h3><button type="button" onClick={()=>setEditingAccount(null)} className="text-sm text-slate-500">取消编辑</button></div>
       <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-sm">用户名<input required value={editAccountDraft.username} onChange={e=>setEditAccountDraft(v=>({...v,username:e.target.value.toLowerCase()}))} className={input+" mt-1"}/></label>
        <label className="text-sm">姓名<input required value={editAccountDraft.full_name} onChange={e=>setEditAccountDraft(v=>({...v,full_name:e.target.value}))} className={input+" mt-1"}/></label>
        <label className="text-sm">登录邮箱<input required type="email" value={editAccountDraft.email} onChange={e=>setEditAccountDraft(v=>({...v,email:e.target.value.toLowerCase()}))} className={input+" mt-1"}/></label>
        <label className="text-sm">角色<select value={editAccountDraft.role} onChange={e=>setEditAccountDraft(v=>({...v,role:e.target.value,factory_id:e.target.value==="factory"?v.factory_id:""}))} className={input+" mt-1"}><option value="sales">销售员</option><option value="factory">工厂用户</option><option value="admin">管理员</option></select></label>
        {editAccountDraft.role==="factory"&&<label className="text-sm">所属工厂<select required value={editAccountDraft.factory_id} onChange={e=>setEditAccountDraft(v=>({...v,factory_id:e.target.value}))} className={input+" mt-1"}><option value="">请选择工厂</option>{factories.filter(f=>f.status==="active").map(f=><option key={f.id} value={f.id}>{f.name} · {f.factory_code}</option>)}</select></label>}
       </div>
       <div className="mt-4 flex gap-2"><button disabled={busy} className={btn}>{busy?"正在保存…":"保存账户修改"}</button><button type="button" onClick={()=>setEditingAccount(null)} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm">取消</button></div>
       <p className="mt-2 text-xs text-slate-500">修改登录邮箱后，新邮箱立即成为登录标识；当前账号不能把自身管理员角色降级。</p>
      </form>}
     </div>
     <div className={panel}>
      <div className="mb-4 flex flex-wrap gap-2">
       <input value={accountSearch} onChange={e=>setAccountSearch(e.target.value)} placeholder="搜索用户名、姓名或邮箱" className={input+" max-w-sm"}/>
       <select value={accountRoleFilter} onChange={e=>setAccountRoleFilter(e.target.value)} className={input+" max-w-48"}><option value="all">全部角色</option><option value="admin">管理员</option><option value="sales">销售员</option><option value="factory">工厂用户</option></select>
       <span className="self-center text-xs text-slate-400">共 {filteredAccounts.length} 个账户</span>
      </div>
      <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm">
       <thead className="bg-slate-50 text-xs text-slate-500"><tr>{["用户名","姓名","邮箱","角色","所属工厂","状态","创建时间","操作"].map(x=><th key={x} className="px-3 py-3">{x}</th>)}</tr></thead>
       <tbody>{filteredAccounts.map(a=><tr key={a.user_id} className="border-t border-slate-100">
        <td className="px-3 py-3 font-semibold">{a.username}</td><td className="px-3 py-3">{a.full_name}</td><td className="px-3 py-3">{a.email}</td><td className="px-3 py-3">{roleLabels[a.role]}</td>
        <td className="px-3 py-3">{factories.find(f=>f.id===a.factory_id)?.name||"—"}</td><td className="px-3 py-3">{a.is_active?"正常":"禁用"}</td><td className="px-3 py-3">{a.created_at?new Date(a.created_at).toLocaleDateString("zh-CN"):"—"}</td>
        <td className="px-3 py-3"><div className="flex flex-wrap gap-2">
         <button onClick={()=>beginEditAccount(a)} className="text-xs font-bold text-sky-700">编辑</button>
         <button onClick={()=>void adminAction("set_active",{user_id:a.user_id,is_active:!a.is_active}).then(()=>loadAccounts()).catch(e=>setError(e.message))} className="text-xs font-bold text-emerald-700">{a.is_active?"禁用":"启用"}</button>
         <button onClick={()=>{const value=window.prompt("请输入新的初始密码（至少10位）");if(value&&value.length>=10)void adminAction("reset_password",{user_id:a.user_id,password:value}).then(()=>setNotice("密码已重置。请安全地将新密码交付给用户。")).catch(e=>setError(e.message));else if(value)setError("新密码至少需要10位。");}} className="text-xs font-bold text-slate-600">重置密码</button>
         {a.role!=="admin"&&<button onClick={()=>{if(window.confirm("确认删除该账号？若有业务历史记录，系统会阻止删除并建议禁用。"))void adminAction("delete_user",{user_id:a.user_id}).then(()=>loadAccounts()).catch(e=>setError(e.message));}} className="text-xs font-bold text-red-700">删除</button>}
        </div></td>
       </tr>)}
       {!filteredAccounts.length&&<tr><td colSpan={8} className="px-3 py-8 text-center text-slate-400">没有符合条件的账户</td></tr>}
       </tbody>
      </table></div>
     </div>
    </div>}

    {module==="branding"&&<div className="space-y-4">
      <div className={panel}><h2 className="text-xl font-black">报价单 Logo 与签章设置</h2><p className="mt-2 text-sm text-slate-500">{profile.role==="admin"?"维护公司级默认报价主体与银行信息。":"维护本工厂专属报价主体与 Logo/签章。" } 图片支持 PNG、JPG、WebP，单张不超过 5 MB。</p></div>
      <form onSubmit={saveBranding} className={panel+" space-y-5"}>
       <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 p-4"><h3 className="font-bold">英文 Logo</h3>{brandingDraft.logo_url&&<img src={brandingDraft.logo_url} alt="Quotation logo" className="mt-3 max-h-24 max-w-full object-contain"/>}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>setBrandingLogo(e.target.files?.[0]||null)} className="mt-3 block w-full text-sm"/>{brandingLogo&&<p className="mt-2 text-xs text-slate-500">待上传：{brandingLogo.name}</p>}<button type="button" onClick={()=>{setBrandingDraft(v=>({...v,logo_url:""}));setBrandingLogo(null);}} className="mt-3 text-xs font-semibold text-red-700">清除已保存 Logo</button></div>
        <div className="rounded-lg border border-slate-200 p-4"><h3 className="font-bold">英文签章</h3>{brandingDraft.stamp_url&&<img src={brandingDraft.stamp_url} alt="Company stamp" className="mt-3 max-h-24 max-w-full object-contain"/>}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>setBrandingStamp(e.target.files?.[0]||null)} className="mt-3 block w-full text-sm"/>{brandingStamp&&<p className="mt-2 text-xs text-slate-500">待上传：{brandingStamp.name}</p>}<button type="button" onClick={()=>{setBrandingDraft(v=>({...v,stamp_url:""}));setBrandingStamp(null);}} className="mt-3 text-xs font-semibold text-red-700">清除已保存签章</button></div>
       </div>
       <div><h3 className="font-bold">报价主体资料（英文）</h3><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {([["legal_name","英文公司法定名称"],["address","公司地址"],["telephone","电话"],["email","业务邮箱"],["website","公司网站"]] as [string,string][]).map(([k,l])=><label key={k} className="text-sm font-semibold">{l}<input value={(brandingDraft as Record<string,string>)[k]} onChange={e=>setBrandingDraft(v=>({...v,[k]:e.target.value}))} className={input+" mt-1.5"}/></label>)}
       </div></div>
       <div><h3 className="font-bold">银行收款信息</h3><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {([["bank_name","银行名称"],["bank_address","银行地址"],["beneficiary","收款人/受益人"],["account_number","银行账号"],["swift_code","SWIFT Code"]] as [string,string][]).map(([k,l])=><label key={k} className="text-sm font-semibold">{l}<input value={(brandingDraft as Record<string,string>)[k]} onChange={e=>setBrandingDraft(v=>({...v,[k]:e.target.value}))} className={input+" mt-1.5"}/></label>)}
       </div></div>
       <div className="flex flex-wrap items-center gap-3"><button disabled={busy} className={btn}>{busy?"正在保存…":"保存 Logo、签章与报价资料"}</button><button type="button" onClick={loadBranding} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm">重新加载</button>{branding?.updated_at&&<span className="text-xs text-slate-400">最近更新：{new Date(branding.updated_at).toLocaleString("zh-CN")}</span>}</div>
      </form>
     </div>}

    {module==="password"&&<form onSubmit={changePassword} className={panel+" max-w-xl"}><h2 className="text-xl font-black">修改登录密码</h2><label className="mt-5 block text-sm font-semibold">新密码<input required minLength={8} type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} className={input+" mt-1.5"}/></label><label className="mt-4 block text-sm font-semibold">确认新密码<input required minLength={8} type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} className={input+" mt-1.5"}/></label><button disabled={busy} className={btn+" mt-5"}>更新密码</button></form>}
    <div className="text-center text-xs text-slate-400">YOUJIU Trade CRM · Supabase authenticated · Role-based access control</div>
   </main>
  </div>
 </div>;
}
