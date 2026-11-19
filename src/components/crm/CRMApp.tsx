"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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
type Quote = { id:string; quote_no:string; status:string; total_usd:number; total_cny:number; created_at:string };
type QuoteLineDraft = { id:string; product_id:string; price_basis:string; quantity:string };
type Order = { id:string; order_no:string; customer_id:string; status:string; total_usd:number; total_cny:number; order_date:string; expected_delivery_date:string|null; actual_delivery_date:string|null; delivery_progress:string|null; buyer_snapshot:{company_name?:string;contact_name?:string;country?:string} };
type OrderUpdate = { id:string; order_id:string; status:string|null; progress_description:string; expected_delivery_date:string|null; actual_delivery_date:string|null; created_at:string };
type Doc = { id:string; document_type:string; document_no:string; status:string; document_date:string; order_id:string };
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
 const [quotes,setQuotes]=useState<Quote[]>([]),[quoteOpen,setQuoteOpen]=useState(false),[quoteCustomerId,setQuoteCustomerId]=useState(""),[quoteValidUntil,setQuoteValidUntil]=useState(""),[quoteIncoterm,setQuoteIncoterm]=useState("FOB"),[quoteLoadingPort,setQuoteLoadingPort]=useState(""),[quoteDestinationPort,setQuoteDestinationPort]=useState(""),[quotePaymentTerms,setQuotePaymentTerms]=useState(""),[quoteDeliveryTerms,setQuoteDeliveryTerms]=useState(""),[quoteRemarks,setQuoteRemarks]=useState(""),[quoteItems,setQuoteItems]=useState<QuoteLineDraft[]>([]),[quoteLineDraft,setQuoteLineDraft]=useState({product_id:"",price_basis:"SKD_USD",quantity:"1"}),[orders,setOrders]=useState<Order[]>([]),[selectedOrder,setSelectedOrder]=useState<Order|null>(null),[orderUpdates,setOrderUpdates]=useState<OrderUpdate[]>([]),[orderDraft,setOrderDraft]=useState({status:"ordered",progress_description:"",expected_delivery_date:"",actual_delivery_date:""}),[docs,setDocs]=useState<Doc[]>([]),[accounts,setAccounts]=useState<Profile[]>([]);
 const [perf,setPerf]=useState<Perf[]>([]),[kpis,setKpis]=useState({customers:0,won:0,usd:0,cny:0,orders:0});
 const [newPassword,setNewPassword]=useState(""),[confirmPassword,setConfirmPassword]=useState("");

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

 async function login(e:React.FormEvent){e.preventDefault();setLoading(true);setError("");setNotice("");try{const r=await fetch(API+"/auth/v1/token?grant_type=password",{method:"POST",headers:{apikey:KEY,"Content-Type":"application/json"},body:JSON.stringify({email:email.trim(),password})});const j=await r.json() as {access_token?:string;refresh_token?:string;msg?:string;message?:string};if(!r.ok||!j.access_token||!j.refresh_token)throw new Error(j.msg||j.message||"邮箱或密码错误。");await establish(j.access_token,j.refresh_token);}catch(e){setError(e instanceof Error?e.message:"登录失败。");}finally{setLoading(false);}}
 async function logout(){try{if(token)await fetch(API+"/auth/v1/logout",{method:"POST",headers:{apikey:KEY,Authorization:"Bearer "+token}});}finally{localStorage.removeItem(SESSION_KEY);setToken("");setUserId("");setProfile(null);setCustomers([]);setProducts([]);setSelected(null);setNotice("已安全退出。");}}

 const loadDashboard=useCallback(async()=>{try{
  const [p,c,o]=await Promise.all([req<Perf[]>("crm_sales_performance?select=*&order=order_total_usd.desc"),req<Array<{id:string;status:string}>>("crm_customers?select=id,status&limit=5000"),req<Array<{id:string;total_usd:number;total_cny:number}>>("crm_orders?select=id,total_usd,total_cny&status=neq.cancelled&limit=5000")]);
  setPerf(p);setKpis({customers:c.length,won:c.filter(x=>x.status==="won").length,usd:o.reduce((s,x)=>s+Number(x.total_usd||0),0),cny:o.reduce((s,x)=>s+Number(x.total_cny||0),0),orders:o.length});
 }catch(e){setError(e instanceof Error?e.message:"看板加载失败。");}},[req]);
 const loadCustomers=useCallback(async()=>{setBusy(true);try{setCustomers(await req<Customer[]>("crm_customers?select=*&order=updated_at.desc&limit=1000"));}catch(e){setError(e instanceof Error?e.message:"客户加载失败。");}finally{setBusy(false);}},[req]);
 const loadProducts=useCallback(async()=>{setBusy(true);try{const [rows,priceRows,factoryRows]=await Promise.all([req<Product[]>("products?select=id,slug,name,model_code,category,factory_id,image,hero_image,published,updated_at&order=created_at.desc&limit=2000"),req<ProductPrice[]>("crm_product_prices?select=product_id,factory_id,skd_price_usd,skd_price_cny,ckd_price_usd,ckd_price_cny,packing_quantity_40hq&limit=2000"),req<Factory[]>("crm_factories?select=id,factory_code,name,status&order=name")]);setProducts(rows);setProductPrices(priceRows);setFactories(factoryRows);}catch(e){setError(e instanceof Error?e.message:"产品加载失败。");}finally{setBusy(false);}},[req]);
 const loadQuotes=useCallback(async()=>{try{setQuotes(await req<Quote[]>("crm_quotes?select=id,quote_no,status,total_usd,total_cny,created_at&order=created_at.desc&limit=500"));}catch(e){setError(e instanceof Error?e.message:"报价加载失败。");}},[req]);
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
  const loadDocs=useCallback(async()=>{try{setDocs(await req<Doc[]>("crm_trade_documents?select=id,document_type,document_no,status,document_date,order_id&order=document_date.desc&limit=500"));}catch(e){setError(e instanceof Error?e.message:"单据加载失败。");}},[req]);
 const loadAccounts=useCallback(async()=>{try{const [rows,fs]=await Promise.all([req<Profile[]>("crm_user_profiles?select=user_id,username,email,full_name,role,factory_id,is_active,created_at&order=created_at.desc"),req<Factory[]>("crm_factories?select=id,factory_code,name,status&order=name")]);setAccounts(rows);setFactories(fs);}catch(e){setError(e instanceof Error?e.message:"账号加载失败。");}},[req]);
 useEffect(()=>{if(!profile)return;if(module==="dashboard")void loadDashboard();if(module==="customers")void loadCustomers();if(module==="products")void loadProducts();if(module==="quotes"){void loadQuotes();void loadCustomers();void loadProducts();}if(module==="orders")void loadOrders();if(module==="documents")void loadDocs();if(module==="accounts"&&profile.role==="admin")void loadAccounts();},[module,profile,loadDashboard,loadCustomers,loadProducts,loadQuotes,loadOrders,loadDocs,loadAccounts]);

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
 async function createAccount(e:React.FormEvent){e.preventDefault();setBusy(true);setError("");try{await adminAction("create_user",accountDraft);setAccountDraft({username:"",email:"",full_name:"",password:"",role:"sales",factory_id:""});setAccountOpen(false);setNotice("CRM 用户已创建，可以将账号和初始密码交付给对应人员。");await loadAccounts();}catch(e){setError(e instanceof Error?e.message:"账号创建失败。");}finally{setBusy(false);}}
 async function saveQuote(e:React.FormEvent){
  e.preventDefault();setBusy(true);setError("");setNotice("");
  try{
    const selectedCustomer=customers.find(x=>x.id===quoteCustomerId);
    if(!selectedCustomer) throw new Error("请先选择客户。");
    if(!quoteItems.length) throw new Error("报价至少需要一条产品明细。");
    const linesForRpc=quoteItems.map(line=>({product_id:line.product_id,price_basis:line.price_basis,quantity:Number(line.quantity)}));
    const result=await req<{id:string;quote_no:string}>("rpc/crm_create_quote",{
      method:"POST",
      body:JSON.stringify({p_quote:{
        customer_id:quoteCustomerId,valid_until:quoteValidUntil||null,incoterm:quoteIncoterm,
        loading_port:quoteLoadingPort,destination_port:quoteDestinationPort,
        payment_terms:quotePaymentTerms,delivery_terms:quoteDeliveryTerms,remarks:quoteRemarks,
        seller_snapshot:{company_name:"YOUJIU",website:"https://www.almcp.com"}
      },p_items:linesForRpc})
    });
    setQuoteOpen(false);setQuoteItems([]);setQuoteCustomerId("");setQuoteValidUntil("");
    setQuoteLoadingPort("");setQuoteDestinationPort("");setQuotePaymentTerms("");setQuoteDeliveryTerms("");setQuoteRemarks("");
    setNotice("报价单 "+result.quote_no+" 已保存为草稿。请检查后再发送给客户。");
    await loadQuotes();
  }catch(e){setError(e instanceof Error?e.message:"报价保存失败。");}
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
   <label className="mt-6 block text-sm font-semibold">登录邮箱<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-emerald-600"/></label>
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
     <div className={panel}><div className="mb-4 flex items-center justify-between"><h3 className="font-bold">报价记录</h3><button onClick={loadQuotes} className="rounded-lg border border-slate-300 px-3 py-2 text-xs">刷新</button></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{["报价编号","状态","USD 总额","CNY 总额","创建日期","操作"].map(x=><th key={x} className="px-3 py-3">{x}</th>)}</tr></thead><tbody>{quotes.map(q=><tr key={q.id} className="border-t border-slate-100"><td className="px-3 py-3 font-bold">{q.quote_no}</td><td className="px-3 py-3">{labels[q.status]||q.status}</td><td className="px-3 py-3">{cash(q.total_usd,"USD")}</td><td className="px-3 py-3">{cash(q.total_cny,"CNY")}</td><td className="px-3 py-3">{d(q.created_at)}</td><td className="px-3 py-3">{!["converted","rejected","expired"].includes(q.status)&&<button disabled={busy} onClick={()=>void convertQuote(q.id)} className="text-xs font-bold text-emerald-700">转为订单 →</button>}</td></tr>)}{!quotes.length&&<tr><td colSpan={6} className="px-3 py-8 text-center text-slate-400">暂无报价记录</td></tr>}</tbody></table></div></div>
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

    {module==="documents"&&profile.role!=="factory"&&<div className={panel}><h2 className="text-xl font-black">外贸单据（CI / PI / PL）</h2><p className="mt-2 text-sm text-slate-500">CI、PI、PL 单据独立快照、编号唯一、字段分区和签章配置已建立数据库基础；单据编辑及 PDF 预览导出界面仍需开发。</p><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{["类型","单据编号","订单 ID","状态","日期"].map(x=><th key={x} className="px-3 py-3">{x}</th>)}</tr></thead><tbody>{docs.map(x=><tr key={x.id} className="border-t border-slate-100"><td className="px-3 py-3 font-bold">{x.document_type}</td><td className="px-3 py-3">{x.document_no}</td><td className="px-3 py-3 text-xs">{x.order_id}</td><td className="px-3 py-3">{labels[x.status]||x.status}</td><td className="px-3 py-3">{d(x.document_date)}</td></tr>)}{!docs.length&&<tr><td colSpan={5} className="px-3 py-8 text-center text-slate-400">暂无外贸单据</td></tr>}</tbody></table></div></div>}

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

    {module==="branding"&&<div className={panel}><h2 className="text-xl font-black">报价单 Logo 与签章设置</h2><p className="mt-2 text-sm text-slate-500">公司级和工厂级 branding_settings 已建立。图片上传、公司/工厂资料编辑和 PDF 自动套用功能将在报价与单据模块接入时一并完成。</p></div>}

    {module==="password"&&<form onSubmit={changePassword} className={panel+" max-w-xl"}><h2 className="text-xl font-black">修改登录密码</h2><label className="mt-5 block text-sm font-semibold">新密码<input required minLength={8} type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} className={input+" mt-1.5"}/></label><label className="mt-4 block text-sm font-semibold">确认新密码<input required minLength={8} type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} className={input+" mt-1.5"}/></label><button disabled={busy} className={btn+" mt-5"}>更新密码</button></form>}
    <div className="text-center text-xs text-slate-400">YOUJIU Trade CRM · Supabase authenticated · Role-based access control</div>
   </main>
  </div>
 </div>;
}
