"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { navigationMenu } from "../data/company";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="container h-full min-h-[76px] flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center shrink-0" aria-label="YOUJIU home" onClick={() => setMenuOpen(false)}>
          <Image src="/youjiu-logo.svg" alt="YOUJIU Intelligent Mobility" width={210} height={60} priority className="w-[154px] sm:w-[180px] lg:w-[210px] h-auto" />
        </Link>

        <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-7">
          {navigationMenu.map((item) => <Link key={item.name} href={item.href} className="text-[11px] tracking-[.12em] uppercase font-bold text-slate-300 hover:text-[#b8ed36] transition-colors">{item.name}</Link>)}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/inquiry" className="btn-primary !py-3 !px-3 sm:!px-4 text-[9px] sm:text-[10px] whitespace-nowrap">Request a Quote <span>↗</span></Link>
          <button
            type="button"
            className="lg:hidden inline-flex h-11 w-11 shrink-0 flex-col items-center justify-center gap-[5px] border border-white/25 text-white"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-primary-navigation"
            onClick={() => setMenuOpen(open => !open)}
          >
            <span className={`block h-[2px] w-5 bg-current transition-transform ${menuOpen ? "translate-y-[7px] rotate-45" : ""}`} />
            <span className={`block h-[2px] w-5 bg-current transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block h-[2px] w-5 bg-current transition-transform ${menuOpen ? "-translate-y-[7px] -rotate-45" : ""}`} />
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav id="mobile-primary-navigation" aria-label="Mobile navigation" className="lg:hidden absolute inset-x-0 top-full z-50 border-t border-white/10 bg-[#101923] shadow-2xl">
          <div className="container py-3 flex flex-col">
            {navigationMenu.map((item) => (
              <Link key={item.name} href={item.href} onClick={() => setMenuOpen(false)} className="min-h-12 flex items-center border-b border-white/10 text-xs tracking-[.12em] uppercase font-bold text-slate-200 hover:text-[#b8ed36]">
                {item.name}
              </Link>
            ))}
            <Link href="/inquiry" onClick={() => setMenuOpen(false)} className="mt-3 min-h-12 flex items-center justify-center bg-[#b8ed36] px-4 text-xs font-black tracking-wider text-[#101923]">
              REQUEST A QUOTE ↗
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
