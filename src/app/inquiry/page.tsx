"use client";
import { useSearchParams } from "next/navigation";
import { Suspense,useEffect,useState } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { getCmsBlock } from "../../lib/cms";

function InquiryForm(){const params=useSearchParams();const [form,setForm]=useState({name:"",email:"",company:"",country:"",whatsapp:"",product_category:params.get("category")||"",product_name:"",quantity:"",message:"",website:""});const [state,setState]=useState<"idle"|"sending"|"success"|"error">("idle");
const change=(e:React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>)=>setForm({...form,[e.target.name]:e.target.value});
async function submit(e:React.FormEvent){e.preventDefault();setState("sending");try{const res=await fetch("/api/inquiries",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});if(!res.ok)throw new Error("Request failed");setState("success");setForm({...form,name:"",email:"",company:"",country:"",whatsapp:"",product_name:"",quantity:"",message:"",website:""});}catch{setState("error");}}
return <form onSubmit={submit} className="bg-white p-7 md:p-10 shadow-sm border border-slate-200"><div className="grid md:grid-cols-2 gap-5">{[["name","Full name *"],["email","Business email *"],["company","Company"],["country","Country"],["whatsapp","WhatsApp / Phone"],["quantity","Estimated quantity"]].map(([name,label])=><label key={name} className="text-xs font-bold text-slate-600">{label}<input required={name==="name"||name==="email"} type={name==="email"?"email":"text"} name={name} value={form[name as keyof typeof form]} onChange={change} className="w-full mt-2 border border-slate-300 px-4 py-3 outline-none focus:border-[#86ad20]" /></label>)}<label className="text-xs font-bold text-slate-600 md:col-span-2">Product category<select name="product_category" value={form.product_category} onChange={change} className="w-full mt-2 border border-slate-300 px-4 py-3 bg-white"><option value="">Select a category</option><option value="electric-motorcycles">Electric Motorcycles</option><option value="electric-bicycles">Electric Bicycles</option><option value="electric-motors">Electric Motors</option><option value="suspension-systems">Suspension Systems</option></select></label><label className="text-xs font-bold text-slate-600 md:col-span-2">Model / product of interest<input name="product_name" value={form.product_name} onChange={change} className="w-full mt-2 border border-slate-300 px-4 py-3"/></label><label className="text-xs font-bold text-slate-600 md:col-span-2">Your requirements *<textarea required minLength={5} name="message" value={form.message} onChange={change} rows={5} placeholder="Please describe your target market, specifications, order quantity and requirements." className="w-full mt-2 border border-slate-300 px-4 py-3 outline-none focus:border-[#86ad20]"/></label><label className="hidden" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" name="website" value={form.website} onChange={change}/></label></div><button disabled={state==="sending"} className="btn-primary mt-7 disabled:opacity-50">{state==="sending"?"SENDING...":"SUBMIT INQUIRY ↗"}</button>{state==="success"&&<p role="status" className="text-green-700 text-sm mt-5">Your enquiry has been submitted. Our team will contact you.</p>}{state==="error"&&<p role="alert" className="text-red-700 text-sm mt-5">Submission failed. Please try again or email alidjie@gmail.com.</p>}<p className="text-[10px] text-slate-400 mt-5">Your information will be used to respond to this business enquiry.</p></form>}
export default function Inquiry(){
  const [hero,setHero] = useState({
    eyebrow:"BUSINESS ENQUIRY",
    headline:"TELL US WHAT YOU NEED.",
    body:"Share your sourcing requirements. We will respond with relevant product information."
  });
  useEffect(()=>{
    let active = true;
    void getCmsBlock("inquiry.hero").then(block=>{
      if(active && block) setHero(current=>({...current,...block.content}));
    });
    return ()=>{ active = false; };
  },[]);
  return <><Header/><main><section className="bg-[#101923] text-white py-16"><div className="container"><div className="eyebrow !text-[#b8ed36] mb-4">{hero.eyebrow}</div><h1 className="text-5xl font-black whitespace-pre-line">{hero.headline}</h1><p className="text-slate-400 mt-5 whitespace-pre-line">{hero.body}</p></div></section><section className="container py-16 grid md:grid-cols-[.7fr_1.3fr] gap-12"><div><h2 className="text-2xl font-black">Start a conversation.</h2><p className="text-slate-500 text-sm leading-7 mt-4">For faster quotation, please include the destination country, target model or specifications, estimated quantity and expected purchasing schedule.</p><div className="mt-8 text-xs text-slate-500">YOUJIU · INTERNATIONAL SALES</div></div><Suspense fallback={<div className="p-8">Loading form...</div>}><InquiryForm/></Suspense></section></main><Footer/></>}

