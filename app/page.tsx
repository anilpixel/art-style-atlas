import { connection } from "next/server";
import Link from "next/link";
import Image from "next/image";
import {
  getAtlasOverview,
  getFeaturedConcepts,
  getConceptCount,
  getFinderUseCases,
} from "@/lib/lexicon";
import SearchBox from "@/components/SearchBox";

export const instant = false;

const pad = (n: number) => String(n).padStart(2, "0");

export default async function Home() {
  await connection();
  const [domains, featured] = await Promise.all([
    getAtlasOverview(),
    getFeaturedConcepts(),
  ]);
  const conceptCount = getConceptCount();
  const totalLineages = domains.reduce((s, d) => s + d.lineageCount, 0);
  const useCases = getFinderUseCases();

  return (
    <main className="min-h-screen bg-white text-neutral-900">
      {/* Hero */}
      <section className="bg-neutral-950 text-white">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-neutral-400">
            An atlas of visual styles for AI creators
          </p>
          <h1 className="mt-4 text-5xl font-black tracking-tight md:text-7xl">
            风格图谱
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-neutral-300 md:text-lg">
            从艺术史、设计、影视到摄影与游戏——把视觉风格整理成可查询、可复用的提示词辞典。
            每个词条都配有示例图、关键特征与可直接复制的中文提示词模板。
          </p>
          <div className="mt-8 max-w-xl bg-white">
            <SearchBox big />
          </div>
          <div className="mt-10 flex gap-8 font-mono text-sm">
            <span>
              <b className="text-2xl font-bold text-white">{domains.length}</b>
              <span className="ml-2 text-neutral-400">领域 DOMAINS</span>
            </span>
            <span>
              <b className="text-2xl font-bold text-white">{totalLineages}</b>
              <span className="ml-2 text-neutral-400">谱系 LINEAGES</span>
            </span>
            <span>
              <b className="text-2xl font-bold text-white">{conceptCount}</b>
              <span className="ml-2 text-neutral-400">风格 STYLES</span>
            </span>
          </div>
        </div>
      </section>

      {/* 按用途找风格 */}
      <section className="bg-neutral-950 text-white">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-neutral-400">
            Find your style
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight">按用途找风格</h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-neutral-400">
            111 种风格太多？先选你要做的东西——每个用途只推荐 6 个最对味的风格，附一句为什么适合。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {useCases.map((uc) => (
              <Link
                key={uc.key}
                href={`/finder?u=${uc.key}`}
                className="group border border-neutral-700 px-5 py-3 transition-colors hover:border-white hover:bg-white hover:text-neutral-900"
              >
                <span className="text-sm font-bold">{uc.nameCn}</span>
                <span className="ml-2 inline-block text-neutral-500 transition-transform group-hover:translate-x-1 group-hover:text-neutral-900">
                  →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 精选风格 */}
      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-neutral-400">
              Featured
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">精选风格</h2>
          </div>
          <Link
            href="/explore"
            className="text-sm font-medium text-neutral-600 underline-offset-4 hover:text-black hover:underline"
          >
            随机探索 →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {featured.map((c) => (
            <Link
              key={c.slug}
              href={`/concept/${c.slug}`}
              className="group overflow-hidden border border-neutral-200 bg-white transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative aspect-square overflow-hidden bg-neutral-100">
                <Image
                  src={c.image}
                  alt={c.nameCn}
                  fill
                  sizes="(max-width: 768px) 50vw, 16vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-bold text-neutral-900">
                  {c.nameCn}
                </p>
                <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                  {c.nameEn}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 领域地图 */}
      <section className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-neutral-400">
            The map
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight">领域地图</h2>
          <p className="mt-2 text-sm text-neutral-600">
            十三个领域，点进去看每个谱系下的具体风格。
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {domains.map((d) => (
              <Link
                key={d.slug}
                href={`/atlas/${d.slug}`}
                className="group overflow-hidden border border-neutral-200 bg-white transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-neutral-100">
                  {d.image && (
                    <Image
                      src={d.image}
                      alt={d.nameCn}
                      fill
                      sizes="(max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                  <span className="absolute left-3 top-3 bg-black/70 px-2 py-1 font-mono text-xs text-white">
                    {pad(d.indexNo)}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-black tracking-tight text-neutral-900">
                    {d.nameCn}
                  </h3>
                  <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-500">
                    {d.nameEn}
                  </p>
                  <p className="mt-4 text-sm font-medium text-neutral-700">
                    {d.lineageCount} 个谱系 · {d.conceptCount} 个风格
                    <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

    </main>
  );
}
