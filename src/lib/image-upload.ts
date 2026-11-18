/**
 * Convert uploaded raster images to optimized WebP before sending them to Supabase Storage.
 * Images are resized proportionally to a maximum 2560px edge and encoded at 82% quality.
 */
export async function convertImageToWebP(file: File): Promise<File> {
  const supportedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
  if (!supportedTypes.has(file.type)) {
    throw new Error(`${file.name}：仅支持 JPG、PNG、WebP 或 AVIF 图片。`);
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error(`${file.name}：原始图片不能超过 12MB。`);
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error(`${file.name}：浏览器无法读取此图片，请另存为 JPG 或 PNG 后重试。`);
  }

  try {
    const maxEdge = 2560;
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) throw new Error("无法创建图片压缩画布，请更换浏览器后重试。");
    context.drawImage(bitmap, 0, 0, width, height);

    const webpBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(blob => {
        if (blob && blob.type === "image/webp") resolve(blob);
        else reject(new Error("当前浏览器不支持 WebP 编码，请使用最新版 Chrome、Edge 或 Safari。"));
      }, "image/webp", 0.82);
    });

    const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
    return new File([webpBlob], `${baseName}.webp`, {
      type: "image/webp",
      lastModified: Date.now()
    });
  } finally {
    bitmap.close();
  }
}

export function formatImageCompression(originalBytes: number, compressedBytes: number): string {
  const saved = originalBytes > 0 ? Math.max(0, Math.round((1 - compressedBytes / originalBytes) * 100)) : 0;
  return `${(originalBytes / 1024 / 1024).toFixed(2)} MB → ${(compressedBytes / 1024 / 1024).toFixed(2)} MB（${saved}% 压缩）`;
}
