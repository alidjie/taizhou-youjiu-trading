import type { MetadataRoute } from "next";

const baseUrl = "https://almcp.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["/", "/products", "/products/electric-motorcycles", "/products/electric-bicycles", "/products/electric-motors", "/products/suspension-systems", "/about", "/contact", "/inquiry"];
  return routes.map((route, index) => ({
    url: `${baseUrl}${route === "/" ? "" : route}`,
    lastModified: new Date(),
    changeFrequency: route === "/" || route.startsWith("/products") ? "weekly" : "monthly",
    priority: index === 0 ? 1 : route.startsWith("/products") ? 0.85 : 0.7
  }));
}
