import React from "react";

function safeHref(value: string) {
  const href = value.trim();
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  try {
    const parsed = new URL(href);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") return href;
  } catch {
    // Reject malformed or unsupported URLs.
  }
  return null;
}

function inline(text: string) {
  const tokenPattern = /(\[[^\]]+\]\((?:https?:\/\/|\/)[^\s)]+\)|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  return text.split(tokenPattern).filter(Boolean).map((part, index) => {
    const linkMatch = part.match(/^\[([^\]]+)\]\(((?:https?:\/\/|\/)[^\s)]+)\)$/);
    if (linkMatch) {
      const href = safeHref(linkMatch[2]);
      if (!href) return <React.Fragment key={index}>{linkMatch[1]}</React.Fragment>;
      const external = /^https?:\/\//i.test(href);
      return <a key={index} href={href} className="text-[#5f8014] underline underline-offset-2 break-words" {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{linkMatch[1]}</a>;
    }
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*")) return <em key={index}>{part.slice(1, -1)}</em>;
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

function tableCells(line: string) {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map(cell => cell.trim());
}

function isTableSeparator(line: string) {
  return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line.trim());
}

export default function BlogContent({ content }: { content: string }) {
  const lines = content.replace(/\r/g, "").split("\n");
  const blocks: React.ReactNode[] = [];
  let unordered: string[] = [];
  let ordered: string[] = [];

  const flushLists = () => {
    if (unordered.length) {
      blocks.push(<ul key={`ul-${blocks.length}`} className="list-disc pl-6 space-y-2 my-5">{unordered.map((item, i) => <li key={i}>{inline(item)}</li>)}</ul>);
      unordered = [];
    }
    if (ordered.length) {
      blocks.push(<ol key={`ol-${blocks.length}`} className="list-decimal pl-6 space-y-2 my-5">{ordered.map((item, i) => <li key={i}>{inline(item)}</li>)}</ol>);
      ordered = [];
    }
  };

  let index = 0;
  while (index < lines.length) {
    const value = lines[index].trim();
    if (!value) {
      flushLists();
      index += 1;
      continue;
    }

    const unorderedMatch = value.match(/^[-*]\s+(.+)$/);
    if (unorderedMatch) {
      if (ordered.length) flushLists();
      unordered.push(unorderedMatch[1]);
      index += 1;
      continue;
    }
    const orderedMatch = value.match(/^\d+[.)]\s+(.+)$/);
    if (orderedMatch) {
      if (unordered.length) flushLists();
      ordered.push(orderedMatch[1]);
      index += 1;
      continue;
    }

    flushLists();

    const imageMatch = value.match(/^!\[([^\]]*)\]\(((?:https?:\/\/|\/)[^\s)]+)\)$/);
    if (imageMatch) {
      const src = safeHref(imageMatch[2]);
      if (src) {
        blocks.push(
          <figure key={index} className="my-8">
            <img src={src} alt={imageMatch[1] || "YOUJIU editorial illustration"} loading="lazy" className="w-full max-h-[560px] object-cover rounded-sm" />
            {imageMatch[1] && <figcaption className="text-xs text-slate-500 mt-2 text-center">{imageMatch[1]}</figcaption>}
          </figure>
        );
      }
      index += 1;
      continue;
    }

    if (value.includes("|") && index + 1 < lines.length && isTableSeparator(lines[index + 1])) {
      const headers = tableCells(value);
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && lines[index].trim().includes("|") && lines[index].trim() !== "") {
        rows.push(tableCells(lines[index]));
        index += 1;
      }
      blocks.push(
        <div key={`table-${index}`} className="my-8 overflow-x-auto border border-slate-200 rounded-sm">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead className="bg-[#f1f4ea] text-[#101923]">
              <tr>{headers.map((cell, i) => <th key={i} scope="col" className="border-b border-slate-200 px-4 py-3 text-left font-bold">{inline(cell)}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => <tr key={rowIndex} className={rowIndex % 2 ? "bg-slate-50" : "bg-white"}>
                {headers.map((_, colIndex) => <td key={colIndex} className="border-b border-slate-100 px-4 py-3 align-top leading-6">{inline(row[colIndex] || "")}</td>)}
              </tr>)}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    if (value.startsWith("### ")) blocks.push(<h3 key={index} className="text-xl font-black mt-8 mb-3">{inline(value.slice(4))}</h3>);
    else if (value.startsWith("## ")) blocks.push(<h2 key={index} className="text-2xl md:text-3xl font-black mt-10 mb-4">{inline(value.slice(3))}</h2>);
    else if (value.startsWith("# ")) blocks.push(<h2 key={index} className="text-3xl md:text-4xl font-black mt-10 mb-5">{inline(value.slice(2))}</h2>);
    else if (value.startsWith("> ")) blocks.push(<blockquote key={index} className="border-l-4 border-[#b8ed36] pl-5 my-6 text-slate-600 italic">{inline(value.slice(2))}</blockquote>);
    else blocks.push(<p key={index} className="text-slate-700 leading-8 my-4">{inline(value)}</p>);
    index += 1;
  }

  flushLists();
  return <div className="blog-prose">{blocks}</div>;
}
