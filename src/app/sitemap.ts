import type { MetadataRoute } from "next";
import { getPublishedProducts } from "../lib/cms";

const baseUrl = "https://almcp.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = ["/", "/products", "/products/electric-motorcycles", "/products/electric-bicycles", "/products/electric-motors", "/products/suspension-systems", "/about", "/contact", "/inquiry"];
  const staticEntries: MetadataRoute.Sitemap = routes.map((route, index) => ({
    url: `${baseUrl}${route === "/" ? "" : route}`,
    lastModified: new Date(),
    changeFrequency: route === "/" || route.startsWith("/products") ? "weekly" : "monthly",
    priority: index === 0 ? 1 : route.startsWith("/products") ? 0.85 : 0.7
  }));
  const products = await getPublishedProducts();
  const productEntries: MetadataRoute.Sitemap = products.map(product => ({
    url: `${baseUrl}/products/${product.category}/${product.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: product.featured ? 0.85 : 0.7
  }));
  return [...staticEntries, ...productEntries];
}
