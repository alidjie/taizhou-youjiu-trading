import Link from "next/link";
import { companyInfo, productCategories } from "../data/company";

export default function Footer() {
  return <footer className="bg-[#101923] text-white pt-16 pb-8">
    <div className="container grid md:grid-cols-4 gap-10 pb-14">
      <div className="md:col-span-2"><div className="text-2xl font-black tracking-[.16em]">YOUJIU</div><p className="text-slate-400 text-sm leading-7 max-w-md mt-5">{companyInfo.description} We connect global buyers with dependable electric mobility and industrial component manufacturing resources.</p><p className="text-slate-500 text-xs mt-6">{companyInfo.address}</p></div>
      <div><h3 className="text-xs tracking-[.18em] font-bold mb-5">PRODUCTS</h3><ul className="space-y-3">{productCategories.map(c=><li key={c.id}><Link className="text-sm text-slate-400 hover:text-[#b8ed36]" href={`/products/${c.id}`}>{c.name}</Link></li>)}</ul></div>
      <div><h3 className="text-xs tracking-[.18em] font-bold mb-5">GET IN TOUCH</h3><p className="text-sm text-slate-400 mb-3">International Sales</p><a className="text-sm text-[#b8ed36]" href={`mailto:${companyInfo.email}`}>{companyInfo.email}</a><p className="text-xs text-slate-500 mt-5">For OEM, wholesale and distribution enquiries.</p></div>
    </div>
    <div className="container border-t border-white/10 pt-6 flex flex-wrap justify-between gap-3 text-[10px] text-slate-500"><span>© {new Date().getFullYear()} YOUJIU. All rights reserved.</span><span>ENGINEERED FOR GLOBAL MOBILITY.</span></div>
  </footer>;
}
