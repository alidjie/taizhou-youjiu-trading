import React from "react";

function inline(text:string) {
  const parts=text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part,index)=>{
    if(part.startsWith("**")&&part.endsWith("**")) return <strong key={index}>{part.slice(2,-2)}</strong>;
    if(part.startsWith("*")&&part.endsWith("*")) return <em key={index}>{part.slice(1,-1)}</em>;
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

export default function BlogContent({ content }: { content:string }) {
  const lines=content.replace(/\r/g,"").split("\n");
  const blocks:React.ReactNode[]=[];
  let list:string[]=[];
  const flush=()=>{if(list.length){blocks.push(<ul key={`list-${blocks.length}`} className="list-disc pl-6 space-y-2 my-5">{list.map((item,i)=><li key={i}>{inline(item)}</li>)}</ul>);list=[];}};
  lines.forEach((line,index)=>{
    const value=line.trim();
    if(!value){flush();return;}
    if(value.startsWith("- ")||value.startsWith("* ")){list.push(value.slice(2));return;}
    flush();
    if(value.startsWith("### ")) blocks.push(<h3 key={index} className="text-xl font-black mt-8 mb-3">{inline(value.slice(4))}</h3>);
    else if(value.startsWith("## ")) blocks.push(<h2 key={index} className="text-2xl md:text-3xl font-black mt-10 mb-4">{inline(value.slice(3))}</h2>);
    else if(value.startsWith("# ")) blocks.push(<h2 key={index} className="text-3xl md:text-4xl font-black mt-10 mb-5">{inline(value.slice(2))}</h2>);
    else if(value.startsWith("> ")) blocks.push(<blockquote key={index} className="border-l-4 border-[#b8ed36] pl-5 my-6 text-slate-600 italic">{inline(value.slice(2))}</blockquote>);
    else blocks.push(<p key={index} className="text-slate-700 leading-8 my-4">{inline(value)}</p>);
  });
  flush();
  return <div className="blog-prose">{blocks}</div>;
}
