import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import type { Metadata } from "next";

export const instant = false;
import {
  getCollection,
  getCollections,
  getConcept,
  getConceptCases,
  getFinderCardImage,
} from "@/lib/lexicon";
import { SITE_URL } from "@/lib/site";
import CopyButton from "@/components/CopyButton";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  await connection();
  const { slug } = await params;
  const c = getCollection(slug);
  if (!c) return {};
  const description = `${c.nameCn}（${c.styles.length} 種風格）：${c.tagline}${c.intro[0]?.slice(0, 80) ?? ""}`;
  return {
    title: `${c.nameCn} | 策展合集 · 風格圖譜`,
    description,
    alternates: { canonical: `${SITE_URL}/collections/${c.slug}` },
    openGraph: {
      title: `${c.nameCn} | 風格圖譜策展合集`,
      description,
      type: "article",
    },
  };
}

async function StyleItem({
  slug,
  note,
  index,
}: {
  slug: string;
  note: string;
  index: number;
}) {
  const concept = await getConcept(slug);
  if (!concept) return null;
  const card = getFinderCardImage(slug);
  const caseCount = getConceptCases(slug).length;
  const num = String(index + 1).padStart(2, "0");
  return (
    <article className="grid grid-cols-1 gap-6 border-b border-neutral-200 py-10 md:grid-cols-[88px_1fr_2fr] md:gap-8">
      <div className="font-mono text-5xl font-black text-neutral-200 md:text-6xl">
        {num}
      </div>
      <div>
        <Link href={`/concept/${concept.slug}`} className="group block">
          <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
            {card.src &&
              (card.isAi ? (
                <Image
                  src={card.src}
                  alt={concept.nameCn}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={card.src}
                  alt={concept.nameCn}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ))}
            {card.isAi && card.src && (
              <span className="absolute left-3 top-3 bg-black/70 px-2 py-1 font-mono text-[10px] text-white">
                AI 復現示意
              </span>
            )}
          </div>
        </Link>
      </div>
      <div className="flex flex-col">
        <Link href={`/concept/${concept.slug}`} className="group w-fit">
          <h2 className="text-2xl font-black tracking-tight text-neutral-900 group-hover:underline group-hover:underline-offset-4">
            {concept.nameCn}
          </h2>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-neutral-500">
            {concept.nameEn}
          </p>
        </Link>
        <p className="mt-4 text-[15px] leading-7 text-neutral-700">{note}</p>
        <div className="mt-auto flex items-center gap-5 pt-5">
          <Link
            href={`/concept/${concept.slug}`}
            className="text-sm font-bold text-neutral-900 underline-offset-4 hover:underline"
          >
            睇完整詞條{" "}
            <span className="inline-block transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>
          {caseCount > 0 && (
            <span className="font-mono text-xs text-neutral-500">
              {caseCount} 個真實案例
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await connection();
  const { slug } = await params;
  const c = getCollection(slug);
  if (!c) notFound();

  const all = getCollections();
  const idx = all.findIndex((x) => x.slug === c.slug);
  const prev = all[(idx - 1 + all.length) % all.length];
  const next = all[(idx + 1) % all.length];
  const shareUrl = `${SITE_URL}/collections/${c.slug}`;

  return (
    <main className="min-h-screen bg-white text-neutral-900">
      {/* 頭部 */}
      <section className="bg-neutral-950 text-white">
        <div className="mx-auto max-w-6xl px-6 py-14 md:py-20">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-neutral-400">
            {c.nameEn} · 策展合集
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
            {c.nameCn}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-9 text-neutral-200">
            {c.tagline}
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-400">
            畀：{c.audience}
          </p>
          <div className="mt-6 flex items-center gap-4 font-mono text-xs text-neutral-400">
            <span>{c.styles.length} 種風格</span>
            <span>·</span>
            <span>約 {Math.max(2, Math.round(c.styles.length * 0.8))} 分鐘讀完</span>
          </div>
        </div>
      </section>

      {/* 編者按 */}
      <section className="border-b border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-neutral-400">
            編者按
          </p>
          <div className="mt-4 max-w-3xl space-y-4 text-[15px] leading-8 text-neutral-700">
            {c.intro.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
      </section>

      {/* 清單 */}
      <section className="mx-auto max-w-6xl px-6 pb-8">
        {c.styles.map((s, i) => (
          <StyleItem key={s.slug} slug={s.slug} note={s.note} index={i} />
        ))}
      </section>

      {/* 分享 + 導航 */}
      <section className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-sm font-bold">覺得有用？成個合集一條 link 分享出去：</p>
            <CopyButton text={shareUrl} label="複製合集連結" />
          </div>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link
              href={`/collections/${prev.slug}`}
              className="border border-neutral-200 bg-white p-5 transition-colors hover:border-neutral-900"
            >
              <p className="font-mono text-xs text-neutral-500">← 上一個合集</p>
              <p className="mt-1 font-bold">{prev.nameCn}</p>
            </Link>
            <Link
              href={`/collections/${next.slug}`}
              className="border border-neutral-200 bg-white p-5 text-right transition-colors hover:border-neutral-900"
            >
              <p className="font-mono text-xs text-neutral-500">下一個合集 →</p>
              <p className="mt-1 font-bold">{next.nameCn}</p>
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/collections"
              className="border border-neutral-200 px-6 py-3 text-sm font-bold text-neutral-700 transition-colors hover:border-neutral-900"
            >
              ← 全部合集
            </Link>
            <Link
              href="/finder"
              className="border border-neutral-900 bg-neutral-900 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-neutral-700"
            >
              按用途找風格 →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
