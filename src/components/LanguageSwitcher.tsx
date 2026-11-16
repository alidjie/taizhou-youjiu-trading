"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const options = [
  ["en", "EN"], ["fr", "FR"], ["de", "DE"], ["es", "ES"],
  ["ar", "AR"], ["ru", "RU"], ["pt", "PT"]
];

export default function LanguageSwitcher() {
  const pathname = usePathname() || "/";
  const [locale, setLocale] = useState("en");
  useEffect(() => {
    const match = pathname.match(/^\\/(en|fr|de|es|ar|ru|pt)(?=\\/|$)/);
    const saved = document.cookie.match(/(?:^|; )youjiu-locale=([^;]+)/)?.[1];
    setLocale(match?.[1] || saved || "en");
  }, [pathname]);

  function changeLanguage(nextLocale: string) {
    document.cookie = `youjiu-locale=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    const clean = pathname.replace(/^\\/(en|fr|de|es|ar|ru|pt)(?=\\/|$)/, "") || "/";
    const destination = nextLocale === "en" ? clean : `/${nextLocale}${clean === "/" ? "" : clean}`;
    window.location.assign(destination);
  }

  return <label className="youjiu-language-switcher" aria-label="Select website language">
    <span className="sr-only">Language</span>
    <select value={locale} onChange={event => changeLanguage(event.target.value)}>
      {options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
    </select>
  </label>;
}
