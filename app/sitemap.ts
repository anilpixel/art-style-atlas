import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getDomains, getAllConceptSlugs, getCollections } from "@/lib/lexicon";

// 程序化 sitemap：首页 + 静态页 + 13 个领域页 + 全部概念页（111+）+ 策展合集。
// 每个概念页都是一个可被搜索命中的独立词条页（"一页一需求词"）。
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [domains, conceptSlugs] = await Promise.all([
    getDomains(),
    getAllConceptSlugs(),
  ]);
  const collections = getCollections();

  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    {
      url: `${SITE_URL}/finder`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/collections`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/explore`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/search`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
  ];

  const domainPages: MetadataRoute.Sitemap = domains.map((d) => ({
    url: `${SITE_URL}/atlas/${d.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const conceptPages: MetadataRoute.Sitemap = conceptSlugs.map((slug) => ({
    url: `${SITE_URL}/concept/${slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const collectionPages: MetadataRoute.Sitemap = collections.map((c) => ({
    url: `${SITE_URL}/collections/${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticPages, ...domainPages, ...conceptPages, ...collectionPages];
}
