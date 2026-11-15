"use client";

import { useEffect, useState } from "react";

type Inquiry = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  country: string;
  phone: string | null;
  product_category: string | null;
  product_name: string | null;
  quantity: string | null;
  message: string;
  status: string;
  created_at: string;
};

const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export default function AdminDashboard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  async function loadInquiries(token: string) {
    if (!apiUrl || !publishableKey) {
      setNotice("Admin connection is not configured. Add the public Supabase URL and publishable key to Vercel.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/rest/v1/inquiries?select=*&order=created_at.desc&limit=200`, {
        headers: { apikey: publishableKey, Authorization: `Bearer ${token}` },
        cache: "no-store"
      });
      if (!response.ok) throw new Error(response.status === 403 ? "This account does not have administrator permissions." : "Unable to load enquiries.");
      setInquiries(await response.json());
      setNotice("");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to load enquiries.");
    } finally {
      setLoading(false);
    }
  }

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!apiUrl || !publishableKey) {
      setNotice("Admin connection is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in Vercel.");
      return;
    }
    setLoading(true);
    setNotice("");
    try {
      const response = await fetch(`${apiUrl}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { apikey: publishableKey, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const result = await response.json();
      if (!response.ok || !result.access_token) throw new Error(result.msg || result.message || "Sign-in failed. Check your email and password.");
      setAccessToken(result.access_token);
      setPassword("");

    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Sign-in failed.");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    if (!apiUrl || !publishableKey || !accessToken) return;
    setNotice("");
    const response = await fetch(`${apiUrl}/rest/v1/inquiries?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify({ status })
    });
    if (!response.ok) {
      setNotice("Status update failed. Check administrator permissions and table policies.");
      return;
    }
    setInquiries(current => current.map(item => item.id === id ? { ...item, status } : item));
  }

  useEffect(() => {
    if (accessToken) void loadInquiries(accessToken);
  }, [accessToken]);

  return (
    <main className="min-h-screen bg-[#f3f5f5] text-[#101923]">
      <header className="bg-[#101923] text-white px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <a href="/" className="font-black tracking-[.18em] text-xl">YOUJIU <span className="text-[#b8ed36]">/</span> ADMIN</a>
          {accessToken && <button onClick={() => { setAccessToken(""); setInquiries([]); setNotice(""); }} className="text-xs text-slate-300 hover:text-white">Sign out</button>}
        </div>
      </header>
      <section className="max-w-7xl mx-auto px-5 py-10">
        {!accessToken ? (
          <div className="max-w-md mx-auto bg-white border border-slate-200 p-8 shadow-sm mt-10">
            <div className="text-[10px] tracking-[.2em] text-[#7ca51c] font-black">PRIVATE MANAGEMENT</div>
            <h1 className="text-3xl font-black mt-3">Admin sign in</h1>
            <p className="text-sm text-slate-500 mt-3 leading-6">Use a Supabase Auth account that has the administrator role assigned in app metadata.</p>
            <form onSubmit={signIn} className="mt-8 space-y-5">
              <label className="block text-xs font-bold">Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className="block w-full border border-slate-300 mt-2 px-4 py-3 font-normal"/></label>
              <label className="block text-xs font-bold">Password<input type="password" required value={password} onChange={e=>setPassword(e.target.value)} className="block w-full border border-slate-300 mt-2 px-4 py-3 font-normal"/></label>
              <button disabled={loading} className="btn-primary w-full disabled:opacity-50">{loading?"SIGNING IN...":"SIGN IN ↗"}</button>
            </form>
            {notice&&<p role="alert" className="text-sm text-red-700 mt-5">{notice}</p>}
          </div>
        ) : (
          <>
            <div className="flex flex-wrap justify-between items-end gap-4 mb-7">
              <div><div className="text-[10px] tracking-[.2em] text-[#7ca51c] font-black">SALES LEADS</div><h1 className="text-4xl font-black mt-2">Customer enquiries</h1><p className="text-slate-500 text-sm mt-2">Latest 200 enquiries · {inquiries.length} records loaded</p></div>
              <button onClick={()=>void loadInquiries(accessToken)} className="border border-slate-300 px-4 py-3 text-xs font-bold">Refresh ↻</button>
            </div>
            {notice&&<p role="alert" className="bg-red-50 text-red-700 p-4 mb-5 text-sm">{notice}</p>}
            <div className="bg-white border border-slate-200 overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[900px]">
                <thead className="bg-[#e9edef] text-[10px] tracking-widest uppercase"><tr>{["Customer","Company / Country","Product","Quantity","Message","Status","Received"].map(label=><th key={label} className="p-4">{label}</th>)}</tr></thead>
                <tbody>{inquiries.map(item=><tr key={item.id} className="border-t border-slate-100 align-top">
                  <td className="p-4"><div className="font-bold">{item.name}</div><a className="text-xs text-blue-700" href={`mailto:${item.email}`}>{item.email}</a>{item.phone&&<div className="text-xs text-slate-500 mt-1">{item.phone}</div>}</td>
                  <td className="p-4 text-xs">{item.company||"—"}<div className="text-slate-500 mt-1">{item.country||"—"}</div></td>
                  <td className="p-4 text-xs">{item.product_name||item.product_category||"General enquiry"}</td>
                  <td className="p-4 text-xs">{item.quantity||"—"}</td>
                  <td className="p-4 text-xs max-w-xs whitespace-pre-wrap">{item.message}</td>
                  <td className="p-4"><select aria-label="Enquiry status" value={item.status||"new"} onChange={e=>void updateStatus(item.id,e.target.value)} className="border border-slate-300 px-2 py-2 text-xs bg-white"><option value="new">New</option><option value="contacted">Contacted</option><option value="quoted">Quoted</option><option value="closed">Closed</option><option value="spam">Spam</option></select></td>
                  <td className="p-4 text-xs text-slate-500 whitespace-nowrap">{new Date(item.created_at).toLocaleString()}</td>
                </tr>)}</tbody>
              </table>
              {!inquiries.length&&!loading&&<p className="p-10 text-center text-slate-500 text-sm">No enquiries found.</p>}
              {loading&&<p className="p-10 text-center text-slate-500 text-sm">Loading...</p>}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
