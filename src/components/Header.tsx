"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { navigationMenu } from "../data/company";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <Link href="/" className="site-brand" aria-label="YOUJIU home" onClick={() => setMenuOpen(false)}>
          <Image src="/youjiu-logo.svg" alt="YOUJIU Intelligent Mobility" width={210} height={60} priority className="site-brand-logo" />
        </Link>
        <nav aria-label="Main navigation" className="desktop-primary-nav">
          {navigationMenu.map(item => <Link key={item.name} href={item.href}>{item.name}</Link>)}
        </nav>
        <div className="site-header-actions">
          <LanguageSwitcher />
          <Link href="/inquiry" className="header-quote-link">Request a Quote <span aria-hidden="true">↗</span></Link>
          <button type="button" className={`mobile-menu-toggle ${menuOpen ? "is-open" : ""}`} aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={menuOpen} aria-controls="mobile-primary-navigation" onClick={() => setMenuOpen(open => !open)}>
            <span /><span /><span />
          </button>
        </div>
      </div>
      <nav id="mobile-primary-navigation" aria-label="Mobile navigation" className={`mobile-primary-nav ${menuOpen ? "is-open" : ""}`} aria-hidden={!menuOpen}>
        <div className="mobile-primary-nav-inner">
          {navigationMenu.map(item => <Link key={item.name} href={item.href} tabIndex={menuOpen ? 0 : -1} onClick={() => setMenuOpen(false)}>{item.name}<span aria-hidden="true">↗</span></Link>)}
          <Link href="/inquiry" className="mobile-menu-quote" tabIndex={menuOpen ? 0 : -1} onClick={() => setMenuOpen(false)}>REQUEST A QUOTE <span aria-hidden="true">↗</span></Link>
        </div>
      </nav>
      {menuOpen && <button type="button" className="mobile-menu-backdrop" aria-label="Close navigation menu" onClick={() => setMenuOpen(false)} />}
    </header>
  );
}
