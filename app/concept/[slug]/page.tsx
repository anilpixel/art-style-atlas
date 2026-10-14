import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import type { Metadata } from "next";

export const instant = false;
import { getConcept, getConceptCases, type RealCase } from "@/lib/lexicon";
import { SITE_URL } from "@/lib/site";
import CopyButton from "@/components/CopyButton";

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
      images: c.image ? [`${SITE_URL}${c.image}`] : undefined,
    },
  };
}

function MetaRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[88px_1fr] gap-4 py-3 border-b border-neutral-200 text-sm">
      <span className="font-mono text-xs uppercase tracking-[0.15em] text-neutral-500 pt-0.5">
        {label}
      </span>
      <span className="leading-6">{value}</span>
    </div>
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

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      {/* 头部：面包屑 + 风格名 + 元数据（AI 示意图已降级为页面底部的折叠区块） */}
      <header className="max-w-3xl">
        <nav className="font-mono text-xs uppercase tracking-[0.2em] text-neutral-500 mb-8">
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

        <h1 className="text-4xl font-bold tracking-tight mb-2">{c.nameCn}</h1>
        <p className="font-mono text-sm uppercase tracking-[0.2em] text-neutral-500 mb-1">
          {c.nameEn}
        </p>
        {c.aliases && (
          <p className="text-sm text-neutral-500 mb-8">又称：{c.aliases}</p>
        )}
        {!c.aliases && <div className="mb-8" />}
        <div className="border-t-2 border-neutral-900">
          <MetaRow label="类型 TYPE" value={c.type} />
          <MetaRow label="年代 ERA" value={c.era} />
          <MetaRow label="谱系 LINEAGE" value={c.lineageNameCn} />
          <MetaRow label="媒介大类" value={c.mediumCategory} />
          <MetaRow label="媒介 MEDIUM" value={c.medium} />
          <MetaRow label="技法" value={c.technique} />
          <MetaRow label="色彩 COLOR" value={c.color} />
          <MetaRow label="光线 LIGHT" value={c.light} />
          <MetaRow label="构图" value={c.composition} />
          <MetaRow label="质感" value={c.texture} />
          <SourceRow url={c.source} />
        </div>
      </header>

      {/* 关键特征 */}
      {c.features && (
        <section className="mt-14 max-w-3xl">
          <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-500 mb-4">
            关键特征 · Key Features
          </h2>
          <p className="text-lg leading-9 mb-6">{c.features}</p>
          {c.keyPoints && c.keyPoints.length > 0 && (
            <ul className="space-y-3">
              {c.keyPoints.map((k, idx) => (
                <li key={idx} className="flex gap-3 leading-7">
                  <span className="font-mono text-sm text-neutral-400 shrink-0">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span>{k}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* 真实案例 */}
      {cases.length > 0 && (
        <section className="mt-14">
          <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-500 mb-2">
            真实案例 · Real Cases
          </h2>
          <p className="text-sm text-neutral-500 mb-6">
            真实作品，不是 AI 生成。图片来自 Wikimedia Commons（免费授权），点击查看来源与授权。
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
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
                    <div className="p-6 text-center">
                      <div className="font-bold text-lg leading-7">{rc.title}</div>
                      {rc.note && (
                        <div className="text-sm text-neutral-500 mt-2 leading-6">{rc.note}</div>
                      )}
                    </div>
                  )}
                </div>
                <div className="p-4">
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

      {/* 提示词 */}
      {c.promptTemplate && (
        <section className="mt-12 max-w-3xl">
          <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-500 mb-4">
            提示词 · Prompt
          </h2>
          <div className="border-2 border-neutral-900 p-6 bg-neutral-50">
            <p className="leading-8 whitespace-pre-wrap">{c.promptTemplate}</p>
          </div>
          <div className="mt-4">
            <CopyButton text={c.promptTemplate} />
          </div>
        </section>
      )}

      {/* AI 复现示意（折叠降级：AI 生成，非真实作品） */}
      {c.image && (
        <section className="mt-14 max-w-3xl">
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
        <section className="mt-14">
          <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-500 mb-6">
            相关风格 · Related
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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
                    <div className="p-4">
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
