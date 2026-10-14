import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import type { Metadata } from "next";

export const instant = false;
import { getDomainDetail } from "@/lib/lexicon";
import { JsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

const pad = (n: number) => String(n).padStart(2, "0");

export async function generateMetadata({
  params,
}: {
  params: Promise<{ domain: string }>;
}): Promise<Metadata> {
  await connection();
  const { domain: slug } = await params;
  const detail = await getDomainDetail(slug);
  if (!detail) return {};
  const { domain, lineages } = detail;
  const lineageNames = lineages.map((l) => l.nameCn).join("、");
  return {
    title: `${domain.nameCn} ${domain.nameEn} | 风格图谱 Style Atlas`,
    description: `「${domain.nameCn}（${domain.nameEn}）」领域的视觉风格词条：${lineageNames}，每个风格含关键特征、AI 绘画提示词与示例图。`,
    alternates: { canonical: `${SITE_URL}/atlas/${domain.slug}` },
    openGraph: {
      title: `${domain.nameCn} ${domain.nameEn} | 风格图谱`,
      type: "website",
    },
  };
}

export default async function DomainPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  await connection();
  const { domain: slug } = await params;
  const detail = await getDomainDetail(slug);
  if (!detail) notFound();
  const { domain, lineages } = detail;

  const domainLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${domain.nameCn} ${domain.nameEn}`,
    url: `${SITE_URL}/atlas/${domain.slug}`,
    inLanguage: "zh-CN",
    description: `「${domain.nameCn}（${domain.nameEn}）」领域的视觉风格词条：${lineages
      .map((l) => l.nameCn)
      .join("、")}。`,
    publisher: { "@type": "Organization", name: "风格图谱 Style Atlas", url: SITE_URL },
  };
  const crumbs = breadcrumbJsonLd([
    { name: "风格图谱", url: SITE_URL },
    { name: domain.nameCn, url: `${SITE_URL}/atlas/${domain.slug}` },
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <JsonLd data={domainLd} />
      <JsonLd data={crumbs} />
      {/* 面包屑 */}
      <nav className="font-mono text-xs uppercase tracking-[0.2em] text-neutral-500 mb-8">
        <Link href="/" className="hover:underline">
          风格图谱
        </Link>
        <span className="mx-2">/</span>
        <span className="text-neutral-900">{domain.nameCn}</span>
      </nav>

      <div className="flex items-baseline gap-4 mb-4">
        <span className="font-mono text-sm text-neutral-400">
          {pad(domain.indexNo)}
        </span>
        <h1 className="text-4xl font-bold tracking-tight">{domain.nameCn}</h1>
      </div>
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-500 mb-12">
        {domain.nameEn}
      </p>

      {lineages.map((lineage) => (
        <section key={lineage.slug} className="mb-14">
          <div className="flex items-baseline gap-3 border-b-2 border-neutral-900 pb-3 mb-6">
            <span className="font-mono text-xs text-neutral-400">
              {pad(lineage.indexNo)}
            </span>
            <h2 className="text-xl font-bold">{lineage.nameCn}</h2>
            <span className="font-mono text-xs uppercase tracking-[0.15em] text-neutral-500">
              {lineage.nameEn}
            </span>
            <span className="ml-auto text-sm text-neutral-500">
              {lineage.concepts.length} 个风格
            </span>
          </div>

          {lineage.concepts.length === 0 ? (
            <p className="text-neutral-400 text-sm py-6">即将收录…</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {lineage.concepts.map((c) => (
                <Link
                  key={c.slug}
                  href={`/concept/${c.slug}`}
                  className="group border border-neutral-200 hover:border-neutral-900 transition-colors"
                >
                  <div className="aspect-[4/3] bg-neutral-100 overflow-hidden relative">
                    {c.image ? (
                      <Image
                        src={c.image}
                        alt={c.nameCn}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-mono text-xs text-neutral-400">
                        NO IMAGE
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="font-bold group-hover:underline underline-offset-4">
                      {c.nameCn}
                    </div>
                    <div className="font-mono text-xs text-neutral-500 mt-1 truncate">
                      {c.nameEn}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
