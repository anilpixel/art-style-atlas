import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import type { Metadata } from "next";

export const instant = false;
import { getConcept, getConceptCases, getViblabLink, type RealCase } from "@/lib/lexicon";
import { JsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { SITE_URL, VIBLAB_URL } from "@/lib/site";
import CopyButton from "@/components/CopyButton";
import ShareCardButton from "@/components/ShareCardButton";

// 每个词条页独立的 Title/Description：一页一需求词，
// 方便"巴洛克风格 / baroque AI绘画"这类长尾词被搜索引擎命中。
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  await connection();
  const { slug } = await params;
  const c = await getConcept(slug);
  if (!c) return {};
  const lead =
    c.features?.trim() || c.keyPoints?.[0]?.trim() || c.aliases?.trim() || "";
  const description =
    `${c.nameCn}（${c.nameEn}）${c.type ? ` · ${c.type}` : ""}${c.era ? ` · ${c.era}` : ""}` +
    (lead ? `：${lead.slice(0, 120)}` : "——为 AI 绘画创作者整理的视觉风格参考。");
  return {
    title: `${c.nameCn} ${c.nameEn} | 风格图谱 Style Atlas`,
    description,
    alternates: { canonical: `${SITE_URL}/concept/${c.slug}` },
    openGraph: {
      title: `${c.nameCn} ${c.nameEn} | 风格图谱`,
      description,
      type: "article",
      // 不设 images：由 app/concept/[slug]/opengraph-image.tsx
      // 按风格动态生成品牌分享卡（P3-2），Next.js 文件约定自动接入。
    },
    twitter: {
      card: "summary_large_image",
      title: `${c.nameCn} ${c.nameEn} | 风格图谱`,
      description,
    },
  };
}

/** 词条页 JSON-LD：CreativeWork（真实案例图 + 授权 + Wikipedia 来源）+ 面包屑 */
function ConceptJsonLd({ c }: { c: NonNullable<Awaited<ReturnType<typeof getConcept>>> }) {
  const cases = getConceptCases(c.slug);
  const realImages = cases
    .filter((rc: RealCase) => rc.kind === "image" && rc.img)
    .slice(0, 5)
    .map((rc) => rc.img!);
  const work = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: `${c.nameCn} ${c.nameEn}`,
    url: `${SITE_URL}/concept/${c.slug}`,
    inLanguage: "zh-CN",
    description: c.keyPoints?.[0] ?? c.features?.slice(0, 200),
    keywords: c.aliases || undefined,
    isPartOf: { "@type": "CreativeWork", name: `${c.lineageNameCn} · ${c.domainNameCn}` },
    sameAs: c.source ? [c.source] : undefined,
    image: realImages.length > 0 ? realImages : c.image ? [`${SITE_URL}${c.image}`] : undefined,
    about: { "@type": "Thing", name: c.type || "艺术风格" },
    publisher: { "@type": "Organization", name: "风格图谱 Style Atlas", url: SITE_URL },
  };
  const crumbs = breadcrumbJsonLd([
    { name: "风格图谱", url: SITE_URL },
    { name: c.domainNameCn, url: `${SITE_URL}/atlas/${c.domainSlug}` },
    { name: c.nameCn, url: `${SITE_URL}/concept/${c.slug}` },
  ]);
  return (
    <>
      <JsonLd data={work} />
      <JsonLd data={crumbs} />
    </>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[72px_1fr] sm:grid-cols-[88px_1fr] gap-3 sm:gap-4 py-3 border-b border-neutral-200 text-sm">
      <span className="font-mono text-xs uppercase tracking-[0.15em] text-neutral-500 pt-0.5">
        {label}
      </span>
      <span className="leading-6">{value}</span>
    </div>
  );
}

/** 渐进披露用的折叠区块标题行：原生 <details>，无 JS，移动端友好 */
function FoldSummary({ children }: { children: React.ReactNode }) {
  return (
    <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 list-none [&::-webkit-details-marker]:hidden hover:bg-neutral-50 select-none">
      <span className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-500">
        {children}
      </span>
      <span className="font-mono text-xl leading-none text-neutral-400 transition-transform duration-200 group-open:rotate-45">
        +
      </span>
    </summary>
  );
}

/** 资料来源：外链到词条撰写所依据的资料（多为 Wikipedia） */
function SourceRow({ url }: { url?: string }) {
  if (!url) return null;
  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
  const label = host.includes("wikipedia.org") ? "Wikipedia" : host;
  return (
    <div className="grid grid-cols-[88px_1fr] gap-4 py-3 border-b border-neutral-200 text-sm">
      <span className="font-mono text-xs uppercase tracking-[0.15em] text-neutral-500 pt-0.5">
        资料来源 SOURCE
      </span>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-4 hover:text-neutral-500"
      >
        {label} ↗
      </a>
    </div>
  );
}

export default async function ConceptPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await connection();
  const { slug } = await params;
  const c = await getConcept(slug);
  if (!c) notFound();

  const related = (
    await Promise.all((c.relatedSlugs || []).map((s) => getConcept(s)))
  ).filter(Boolean);
  const cases = getConceptCases(slug);
  const viblab = getViblabLink(slug);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <ConceptJsonLd c={c} />
      {/* 头部：面包屑 + 风格名 + 3 个核心属性（其余属性折叠，渐进披露） */}
      <header className="max-w-3xl">
        <nav className="font-mono text-xs uppercase tracking-[0.2em] text-neutral-500 mb-6 sm:mb-8">
          <Link href="/" className="hover:underline">
            风格图谱
          </Link>
          <span className="mx-2">/</span>
          <Link href={`/atlas/${c.domainSlug}`} className="hover:underline">
            {c.domainNameCn}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-neutral-900">{c.nameCn}</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
          {c.nameCn}
        </h1>
        <p className="font-mono text-sm uppercase tracking-[0.2em] text-neutral-500 mb-1">
          {c.nameEn}
        </p>
        {c.aliases && (
          <p className="text-sm text-neutral-500 mb-6 sm:mb-8">又称：{c.aliases}</p>
        )}
        {!c.aliases && <div className="mb-6 sm:mb-8" />}
        <div className="border-t-2 border-neutral-900">
          <MetaRow label="类型 TYPE" value={c.type} />
          <MetaRow label="年代 ERA" value={c.era} />
          <MetaRow label="谱系 LINEAGE" value={c.lineageNameCn} />
        </div>
        {/* 更多属性：默认折叠 */}
        {(c.mediumCategory ||
          c.medium ||
          c.technique ||
          c.color ||
          c.light ||
          c.composition ||
          c.texture ||
          c.source) && (
          <details className="group border-b border-neutral-200">
            <FoldSummary>更多属性 · More Attributes</FoldSummary>
            <div className="pb-2">
              <MetaRow label="媒介大类" value={c.mediumCategory} />
              <MetaRow label="媒介 MEDIUM" value={c.medium} />
              <MetaRow label="技法" value={c.technique} />
              <MetaRow label="色彩 COLOR" value={c.color} />
              <MetaRow label="光线 LIGHT" value={c.light} />
              <MetaRow label="构图" value={c.composition} />
              <MetaRow label="质感" value={c.texture} />
              <SourceRow url={c.source} />
            </div>
          </details>
        )}
      </header>

      {/* 一眼看懂：首屏只留 3 个关键特征 */}
      {c.keyPoints && c.keyPoints.length > 0 && (
        <section className="mt-10 sm:mt-14 max-w-3xl">
          <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-500 mb-4">
            一眼看懂 · At a Glance
          </h2>
          <ul className="space-y-3">
            {c.keyPoints.slice(0, 3).map((k, idx) => (
              <li key={idx} className="flex gap-3 leading-7">
                <span className="font-mono text-sm text-neutral-400 shrink-0">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span className="text-base sm:text-lg">{k}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 真实案例：前置到首屏区域（渐进披露：只留 3 个关键特征 + 真实案例） */}
      {cases.length > 0 && (
        <section className="mt-10 sm:mt-14">
          <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-500 mb-2">
            真实案例 · Real Cases
          </h2>
          <p className="text-sm text-neutral-500 mb-6">
            真实作品，不是 AI 生成。图片来自 Wikimedia Commons（免费授权），点击查看来源与授权。
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
            {cases.map((rc, idx) => (
              <a
                key={idx}
                href={rc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group border border-neutral-200 hover:border-neutral-900 transition-colors"
              >
                <div className="aspect-[4/3] bg-neutral-100 relative overflow-hidden flex items-center justify-center">
                  {rc.kind === "image" && rc.img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={rc.img}
                      alt={rc.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="p-4 sm:p-6 text-center">
                      <div className="font-bold text-base sm:text-lg leading-7">{rc.title}</div>
                      {rc.note && (
                        <div className="text-sm text-neutral-500 mt-2 leading-6">{rc.note}</div>
                      )}
                    </div>
                  )}
                </div>
                <div className="p-3 sm:p-4">
                  <div className="font-bold group-hover:underline underline-offset-4 leading-6">
                    {rc.title}
                  </div>
                  <div className="text-xs text-neutral-500 mt-1">
                    {[rc.creator, rc.year].filter(Boolean).join(" · ")}
                  </div>
                  {rc.license && (
                    <div className="inline-block font-mono text-[10px] uppercase tracking-wider border border-neutral-300 text-neutral-500 px-2 py-0.5 mt-2">
                      {rc.license}
                    </div>
                  )}
                  {rc.kind === "work" && (
                    <div className="font-mono text-[10px] uppercase tracking-wider text-neutral-400 mt-2">
                      代表作外链 ↗
                    </div>
                  )}
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* 一键分享卡（P3-2）：看完真实案例、决定采用风格后，自然的下一步就是分享 */}
      <section className="mt-10 sm:mt-14 max-w-3xl">
        <ShareCardButton slug={c.slug} nameCn={c.nameCn} />
      </section>

      {/* 完整特征描述：默认折叠（渐进披露） */}
      {c.features && (
        <section className="mt-10 sm:mt-14 max-w-3xl">
          <details className="group border border-neutral-200">
            <FoldSummary>完整特征描述 · Full Description</FoldSummary>
            <p className="px-5 pb-6 leading-8 sm:leading-9 text-base sm:text-lg">
              {c.features}
            </p>
          </details>
        </section>
      )}

      {/* 提示词（保持展开：vibe coder 要直接复制） */}
      {c.promptTemplate && (
        <section className="mt-10 sm:mt-12 max-w-3xl">
          <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-500 mb-4">
            提示词 · Prompt
          </h2>
          <div className="border-2 border-neutral-900 p-4 sm:p-6 bg-neutral-50">
            <p className="leading-7 sm:leading-8 whitespace-pre-wrap text-[15px] sm:text-base">
              {c.promptTemplate}
            </p>
          </div>
          <div className="mt-4">
            <CopyButton text={c.promptTemplate} />
          </div>
        </section>
      )}

      {/* Viblab 互链（P3-3）：提示词复制完 → 下一步去姊妹站把风格做成可玩游戏。
          只对 6 个与 Viblab 风格页 1:1 对应的游戏词条显示，不硬凑。 */}
      {viblab && (
        <section className="mt-10 sm:mt-12 max-w-3xl">
          <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-500 mb-4">
            用 AI 做出来 · Build it with AI
          </h2>
          <div className="border-2 border-neutral-900 p-4 sm:p-6 bg-neutral-50">
            <p className="text-sm leading-6 text-neutral-600 mb-4">
              在姊妹站 Viblab 把{c.nameCn}变成可玩游戏 —— 实战指南、可复制的提示词、可玩 demo。
            </p>
            <div className="flex flex-col gap-2.5">
              <a
                href={`${VIBLAB_URL}/styles/${viblab.styleSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between gap-4 border border-neutral-900 bg-white px-4 py-3 hover:bg-neutral-900 hover:text-white transition-colors"
              >
                <span>
                  <span className="font-bold group-hover:underline underline-offset-4">
                    {viblab.styleName} 实战页 · Viblab
                  </span>
                  <span className="block text-xs text-neutral-500 group-hover:text-neutral-300 mt-1">
                    vibe coding 难度评估 + 可复制美术提示词 + 可玩 demo
                  </span>
                </span>
                <span aria-hidden className="shrink-0 font-mono">↗</span>
              </a>
              {viblab.guides.map((g) => (
                <a
                  key={g.slug}
                  href={`${VIBLAB_URL}/guides/${g.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between gap-4 border border-neutral-300 bg-white px-4 py-3 hover:border-neutral-900 transition-colors"
                >
                  <span>
                    <span className="font-bold group-hover:underline underline-offset-4">
                      {g.label}
                    </span>
                    <span className="block text-xs text-neutral-500 mt-1">
                      {g.note}
                    </span>
                  </span>
                  <span aria-hidden className="shrink-0 font-mono text-neutral-400">↗</span>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* AI 复现示意（折叠降级：AI 生成，非真实作品） */}
      {c.image && (
        <section className="mt-10 sm:mt-14 max-w-3xl">
          <details className="group border border-neutral-200">
            <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 list-none [&::-webkit-details-marker]:hidden hover:bg-neutral-50">
              <span>
                <span className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-500">
                  AI 复现示意 · AI Demo
                </span>
                <span className="block text-[11px] text-neutral-400 mt-1 leading-5">
                  AI 生成，非真实作品 —— 真实代表作请见上方「真实案例」。点击展开查看。
                </span>
              </span>
              <span className="font-mono text-xl leading-none text-neutral-400 select-none transition-transform duration-200 group-open:rotate-45">
                +
              </span>
            </summary>
            <div className="px-5 pb-5">
              <div className="aspect-[4/3] bg-neutral-100 relative overflow-hidden max-w-xl">
                <Image
                  src={c.image}
                  alt={`${c.nameCn} AI 复现示意`}
                  fill
                  sizes="(max-width: 768px) 100vw, 42vw"
                  className="object-cover"
                />
              </div>
              <p className="font-mono text-xs text-neutral-400 mt-3 leading-5">
                AI 复现示意 · {c.nameEn} —— 以 [主体] 替换为你自己的创作对象即可使用
              </p>
            </div>
          </details>
        </section>
      )}

      {/* 相关风格 */}
      {related.length > 0 && (
        <section className="mt-10 sm:mt-14">
          <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-500 mb-6">
            相关风格 · Related
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {related.map(
              (r) =>
                r && (
                  <Link
                    key={r.slug}
                    href={`/concept/${r.slug}`}
                    className="group border border-neutral-200 hover:border-neutral-900 transition-colors"
                  >
                    <div className="aspect-[4/3] bg-neutral-100 relative overflow-hidden">
                      {r.image ? (
                        <Image
                          src={r.image}
                          alt={r.nameCn}
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
                    <div className="p-3 sm:p-4">
                      <div className="font-bold group-hover:underline underline-offset-4">
                        {r.nameCn}
                      </div>
                      <div className="font-mono text-xs text-neutral-500 mt-1 truncate">
                        {r.nameEn}
                      </div>
                    </div>
                  </Link>
                )
            )}
          </div>
        </section>
      )}
    </div>
  );
}
