import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { connection } from "next/server";
import {
  getFinderUseCase,
  getFinderUseCases,
  getFinderCardImage,
  getConcept,
  getCollection,
  USECASE_COLLECTION,
  type FinderStyle,
} from "@/lib/lexicon";

export const instant = false;

export const metadata: Metadata = {
  title: "按用途找风格 · 风格图谱",
  description:
    "做恐怖游戏、复古像素、科幻未来、国风……先选用途，每个用途只推荐 6 个最对味的美术风格，附真实案例与可复制提示词。",
};

async function FinderCard({ style }: { style: FinderStyle }) {
  const [concept, card] = await Promise.all([
    getConcept(style.slug),
    Promise.resolve(getFinderCardImage(style.slug)),
  ]);
  if (!concept) return null;
  return (
    <Link
      href={`/concept/${concept.slug}`}
      className="group flex flex-col overflow-hidden border border-neutral-200 bg-white transition-all hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
        {card.isAi ? (
          <Image
            src={card.src}
            alt={concept.nameCn}
            fill
            sizes="(max-width: 768px) 50vw, 33vw"
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
        )}
        {card.isAi && (
          <span className="absolute left-3 top-3 bg-black/70 px-2 py-1 font-mono text-[10px] text-white">
            AI 复现示意
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-lg font-black tracking-tight text-neutral-900 group-hover:underline group-hover:underline-offset-4">
          {concept.nameCn}
        </p>
        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-neutral-500">
          {concept.nameEn}
        </p>
        <p className="mt-3 text-sm leading-6 text-neutral-600">{style.note}</p>
        <p className="mt-auto pt-4 text-sm font-medium text-neutral-900">
          查看词条 <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
        </p>
      </div>
    </Link>
  );
}

export default async function FinderPage({
  searchParams,
}: {
  searchParams: Promise<{ u?: string }>;
}) {
  await connection();
  const { u } = await searchParams;
  const useCases = getFinderUseCases();
  const active = (u && getFinderUseCase(u)) || useCases[0];
  const relatedSlug = USECASE_COLLECTION[active.key];
  const related = relatedSlug ? getCollection(relatedSlug) : null;

  return (
    <main className="min-h-screen bg-white text-neutral-900">
      {/* 头部 */}
      <section className="bg-neutral-950 text-white">
        <div className="mx-auto max-w-6xl px-6 py-14 md:py-20">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-neutral-400">
            Find your style
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
            按用途找风格
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-neutral-300">
            不知道 111 种风格从哪看起？先选你要做的东西——每个用途只给你 6 个最对味的风格，
            附一句为什么适合它。点进去看真实案例与可复制的提示词。
          </p>
        </div>
      </section>

      {/* 用途选择 */}
      <section className="sticky top-0 z-10 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {useCases.map((uc) => (
              <Link
                key={uc.key}
                href={`/finder?u=${uc.key}`}
                className={`whitespace-nowrap border px-4 py-2 text-sm font-bold transition-colors ${
                  uc.key === active.key
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-900"
                }`}
              >
                {uc.nameCn}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 推荐风格 */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-neutral-400">
            {active.nameEn}
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">
            {active.nameCn}
          </h2>
          <p className="mt-2 text-sm text-neutral-600">{active.tagline}</p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {active.styles.map((s) => (
            <FinderCard key={s.slug} style={s} />
          ))}
        </div>
        {related && (
          <Link
            href={`/collections/${related.slug}`}
            className="group mt-10 flex items-center justify-between gap-6 border border-neutral-900 bg-neutral-950 p-6 text-white transition-colors hover:bg-neutral-800"
          >
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-neutral-400">
                延伸閱讀 · 策展合集
              </p>
              <p className="mt-2 text-xl font-black tracking-tight">
                {related.nameCn}
              </p>
              <p className="mt-1 text-sm text-neutral-400">{related.tagline}</p>
            </div>
            <span className="shrink-0 text-2xl transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>
        )}
        <div className="mt-12 flex flex-wrap gap-4">
          <Link
            href="/explore"
            className="border border-neutral-900 bg-neutral-900 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-neutral-700"
          >
            还是没灵感？随机探索 →
          </Link>
          <Link
            href="/"
            className="border border-neutral-200 px-6 py-3 text-sm font-bold text-neutral-700 transition-colors hover:border-neutral-900"
          >
            ← 回首页领域地图
          </Link>
        </div>
      </section>
    </main>
  );
}
