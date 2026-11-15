import Link from "next/link";
import Image from "next/image";
import { navigationMenu } from "../data/company";

export default function Header() {
  return (
    <header className="site-header">
      <div className="container h-full flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center shrink-0" aria-label="YOUJIU home">
          <Image src="/youjiu-logo.svg" alt="YOUJIU Intelligent Mobility" width={210} height={60} priority />
        </Link>
        <nav className="hidden lg:flex items-center gap-7">
          {navigationMenu.map((item) => <Link key={item.name} href={item.href} className="text-[11px] tracking-[.12em] uppercase font-bold text-slate-300 hover:text-[#b8ed36] transition-colors">{item.name}</Link>)}
        </nav>
        <Link href="/inquiry" className="btn-primary !py-3 !px-4 text-[10px]">Request a Quote <span>↗</span></Link>
      </div>
    </header>
  );
}
