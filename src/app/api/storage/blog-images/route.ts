import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://fsqpeuulaglnnwfyxndj.supabase.co";
const PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_27Jb43sOATe3CJlIEP-zVQ_-QFD6HOB";
const MAX_FILE_SIZE = 12 * 1024 * 1024;

function safeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "article";
}

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  if (!authorization.startsWith("Bearer ")) {
    return NextResponse.json({ error: "请先登录 YOUJIU 管理后台。" }, { status: 401 });
  }

  // Validate the caller's Supabase session before forwarding the upload.
  const authCheck = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    method: "GET",
    headers: {
      apikey: PUBLISHABLE_KEY,
      Authorization: authorization
    },
    cache: "no-store"
  });

  if (!authCheck.ok) {
    return NextResponse.json({ error: "登录会话无效或已过期，请重新登录后上传。" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "上传数据格式错误，请重新选择图片。" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "没有收到图片文件。" }, { status: 400 });
  }
  if (file.type !== "image/webp") {
    return NextResponse.json({ error: "上传接口仅接受已压缩转换的 WebP 图片。" }, { status: 415 });
  }
  if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "WebP 图片大小必须在 1 字节至 12MB 之间。" }, { status: 413 });
  }

  const slugValue = form.get("slug");
  const slug = safeSlug(typeof slugValue === "string" ? slugValue : "article");
  const path = `blog/${slug}/${randomUUID()}.webp`;
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");

  const uploadResponse = await fetch(
    `${SUPABASE_URL}/storage/v1/object/blog-images/${encodedPath}`,
    {
      method: "POST",
      headers: {
        apikey: PUBLISHABLE_KEY,
        Authorization: authorization,
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
        "x-upsert": "false"
      },
      body: file,
      cache: "no-store"
    }
  );

  if (!uploadResponse.ok) {
    const detail = await uploadResponse.text();
    const message = uploadResponse.status === 403
      ? "Supabase Storage 拒绝上传。请确认当前账号在 cms_admins 中，且对应 CRM 用户角色为 admin。"
      : `Supabase Storage 上传失败（HTTP ${uploadResponse.status}）：${detail.slice(0, 500)}`;
    return NextResponse.json({ error: message }, { status: uploadResponse.status });
  }

  return NextResponse.json({
    path,
    url: `${SUPABASE_URL}/storage/v1/object/public/blog-images/${path}`
  });
}
