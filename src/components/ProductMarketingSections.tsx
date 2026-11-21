import type { CmsMarketingBlock } from "../lib/cms";

type Props = { blocks?: CmsMarketingBlock[] | null };

function rows(value?: string) {
  return (value || "").split("\n").map((line) => line.trim()).filter(Boolean);
}

function safeUrl(value?: string) {
  const url = (value || "").trim();
  return url.startsWith("https://") || url.startsWith("http://") || url.startsWith("/") ? url : "";
}

function pair(line: string) {
  const parts = line.split("|").map((part) => part.trim());
  return { title: parts[0] || "", description: parts.slice(1).join(" | ") };
}

function videoEmbed(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") return "https://www.youtube-nocookie.com/embed/" + parsed.pathname.slice(1);
    if (parsed.hostname.endsWith("youtube.com")) {
      const id = parsed.searchParams.get("v");
      if (id) return "https://www.youtube-nocookie.com/embed/" + id;
      if (parsed.pathname.startsWith("/embed/")) return "https://www.youtube-nocookie.com" + parsed.pathname;
    }
    if (parsed.hostname.endsWith("vimeo.com")) {
      const id = parsed.pathname.split("/").filter(Boolean).pop();
      if (id && /^\d+$/.test(id)) return "https://player.vimeo.com/video/" + id;
    }
  } catch {}
  return "";
}

export default function ProductMarketingSections({ blocks }: Props) {
  const visible = (blocks || []).filter((block) => block.enabled !== false).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  if (!visible.length) return null;

  return <div className="product-marketing-content">
    {visible.map((block) => {
      const c = block.content || {};
      const title = c.title || "";
      const eyebrow = c.eyebrow || "";
      const body = c.body || "";
      const image = safeUrl(c.image_url);
      const entries = rows(c.items).map(pair).filter((item) => item.title || item.description);

      if (block.type === "story") return <section key={block.id} className="container py-14 border-t border-slate-100">
        <div className="max-w-4xl mx-auto">{eyebrow && <div className="eyebrow mb-3">{eyebrow}</div>}{title && <h2 className="text-3xl md:text-4xl font-black text-[#101923]">{title}</h2>}{body && <div className="mt-6 space-y-4 text-slate-600 leading-8 whitespace-pre-line">{body}</div>}</div>
      </section>;

      if (block.type === "image_text") return <section key={block.id} className="container py-14 border-t border-slate-100">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className={c.image_position === "right" ? "md:order-1" : "md:order-2"}>{eyebrow && <div className="eyebrow mb-3">{eyebrow}</div>}{title && <h2 className="text-3xl font-black text-[#101923]">{title}</h2>}{body && <p className="mt-5 text-slate-600 leading-8 whitespace-pre-line">{body}</p>}</div>
          {image && <img src={image} alt={c.image_alt || title || "Product detail"} className={c.image_position === "right" ? "md:order-2 w-full max-h-[480px] object-contain bg-slate-50" : "md:order-1 w-full max-h-[480px] object-contain bg-slate-50"}/>}
        </div>
      </section>;

      if (block.type === "feature_grid" || block.type === "applications") return <section key={block.id} className="bg-[#f5f7f5] py-14">
        <div className="container">{eyebrow && <div className="eyebrow mb-3">{eyebrow}</div>}{title && <h2 className="text-3xl font-black text-[#101923]">{title}</h2>}{body && <p className="mt-4 max-w-3xl text-slate-600 leading-7">{body}</p>}
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{entries.map((item, index) => <article key={index} className="bg-white border border-slate-200 p-6"><div className="text-xs font-bold tracking-widest text-[#789d22] mb-3">{String(index + 1).padStart(2, "0")}</div><h3 className="font-black text-lg text-[#101923]">{item.title}</h3>{item.description && <p className="mt-3 text-sm text-slate-600 leading-6">{item.description}</p>}</article>)}</div>
        </div>
      </section>;

      if (block.type === "comparison_table") {
        const headers = (c.headers || "").split("|").map((part) => part.trim()).filter(Boolean);
        return <section key={block.id} className="container py-14 border-t border-slate-100">
          {eyebrow && <div className="eyebrow mb-3">{eyebrow}</div>}{title && <h2 className="text-3xl font-black text-[#101923] mb-6">{title}</h2>}
          <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-sm border-collapse"><thead><tr>{headers.map((header, index) => <th key={index} className="bg-[#101923] text-white text-left p-4">{header}</th>)}</tr></thead><tbody>{entries.map((item, index) => <tr key={index} className="border-b border-slate-200">{[item.title, ...item.description.split("|").map((x) => x.trim())].map((cell, cellIndex) => <td key={cellIndex} className="p-4 text-slate-700">{cell}</td>)}</tr>)}</tbody></table></div>
        </section>;
      }

      if (block.type === "faq") return <section key={block.id} className="container py-14 border-t border-slate-100">
        <div className="max-w-4xl mx-auto">{eyebrow && <div className="eyebrow mb-3">{eyebrow}</div>}{title && <h2 className="text-3xl font-black text-[#101923] mb-6">{title}</h2>}
          <div className="divide-y divide-slate-200">{entries.map((item, index) => <details key={index} className="py-4"><summary className="cursor-pointer font-bold text-[#101923]">{item.title}</summary><p className="mt-3 text-slate-600 leading-7 whitespace-pre-line">{item.description}</p></details>)}</div>
        </div>
      </section>;

      if (block.type === "video") {
        const embed = videoEmbed(c.video_url || "");
        return <section key={block.id} className="container py-14 border-t border-slate-100">
          {eyebrow && <div className="eyebrow mb-3">{eyebrow}</div>}{title && <h2 className="text-3xl font-black text-[#101923] mb-6">{title}</h2>}
          {embed ? <div className="aspect-video max-w-5xl mx-auto bg-black"><iframe src={embed} title={title || "Product video"} className="w-full h-full" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen/></div> : <p className="text-sm text-slate-500">Video link not available.</p>}
        </section>;
      }

      if (block.type === "downloads") return <section key={block.id} className="container py-14 border-t border-slate-100">
        {eyebrow && <div className="eyebrow mb-3">{eyebrow}</div>}{title && <h2 className="text-3xl font-black text-[#101923] mb-6">{title}</h2>}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{entries.map((item, index) => <a key={index} href={safeUrl(item.description)} target="_blank" rel="noreferrer" className="border border-slate-200 p-4 flex items-center justify-between gap-3 hover:border-[#789d22]"><span className="font-semibold text-sm">{item.title}</span><span aria-hidden="true">↓</span></a>)}</div>
      </section>;

      if (block.type === "cta") {
        const buttonUrl = safeUrl(c.button_url);
        return <section key={block.id} className="bg-[#101923] text-white py-14"><div className="container max-w-5xl text-center">{eyebrow && <div className="eyebrow !text-[#b8ed36] mb-3">{eyebrow}</div>}{title && <h2 className="text-3xl md:text-4xl font-black">{title}</h2>}{body && <p className="mt-4 text-slate-300 leading-7">{body}</p>}{buttonUrl && <a href={buttonUrl} className="btn-primary inline-block mt-7">{c.button_label || "Contact us"} ↗</a>}</div></section>;
      }
      return null;
    })}
  </div>;
}
