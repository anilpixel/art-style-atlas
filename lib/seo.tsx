// SEO / 结构化数据 helper（P3-1）。
// JSON-LD 挂在各页面头部，供搜索引擎读取：真实案例图、授权、
// Wikipedia 资料来源（sameAs）→ 强化"真实性信号"（认知心理学审计 #5）。
import { SITE_URL } from "@/lib/site";

/** JSON-LD <script> 输出组件 */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "风格图谱 Style Atlas",
    url: SITE_URL,
    inLanguage: "zh-CN",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}
