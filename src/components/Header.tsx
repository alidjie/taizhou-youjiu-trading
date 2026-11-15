import Link from "next/link";
import { navigationMenu } from "../data/company";

export default function Header() {
  return (
    <header className="site-header">
      <div className="container h-full flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-3 shrink-0" aria-label="YOUJIU home">
          <span className="w-10 h-10 bg-[#b8ed36] text-[#101923] flex items-center justify-center font-black text-xl italic">Y</span>
          <span className="leading-none"><strong className="block text-[23px] tracking-[.12em] font-black">YOUJIU</strong><small className="block mt-1 text-[8px] tracking-[.24em] text-slate-400">INTELLIGENT MOBILITY</small></span>
        </Link>
        <nav className="hidden lg:flex items-center gap-7">
          {navigationMenu.map((item) => <Link key={item.name} href={item.href} className="text-[11px] tracking-[.12em] uppercase font-bold text-slate-300 hover:text-[#b8ed36] transition-colors">{item.name}</Link>)}
        </nav>
        <Link href="/inquiry" className="btn-primary !py-3 !px-4 text-[10px]">Request a Quote <span>↗</span></Link>
      </div>
    </header>
  );
}
