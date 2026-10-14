import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import {
  getCollections,
  getCollectionCoverImage,
} from "@/lib/lexicon";

export const metadata: Metadata = {
  title: "策展合集 · 風格圖譜",
  description:
    "編輯精選嘅美術風格清單：恐怖遊戲 8 種風格、復古像素全指南、治癒系畫風、賽博朋克之外、國風 8 式——可以直接分享畀隊友同甲方。",
};

function CollectionCard({ slug }: { slug: string }) {
  const collections = getCollections();
  const c = collections.find((x) => x.slug === slug);
  if (!c) return null;
  const cover = getCollectionCoverImage(c.slug);
  return (
    <Link
      href={`/collections/${c.slug}`}
      className="group flex flex-col overflow-hidden border border-neutral-200 bg-white transition-all hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-neutral-100">
        {cover.src &&
          (cover.isAi ? (
            <Image
              src={cover.src}
              alt={c.nameCn}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover.src}
              alt={c.nameCn}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ))}
        {cover.isAi && cover.src && (
          <span className="absolute left-3 top-3 bg-black/70 px-2 py-1 font-mono text-[10px] text-white">
            AI 復現示意
          </span>
        )}
        <span className="absolute bottom-3 right-3 bg-neutral-950/85 px-2 py-1 font-mono text-[11px] text-white">
          {c.styles.length} 種風格
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
          {c.nameEn}
        </p>
        <p className="mt-1 text-xl font-black tracking-tight text-neutral-900 group-hover:underline group-hover:underline-offset-4">
          {c.nameCn}
        </p>
        <p className="mt-2 text-sm leading-6 text-neutral-600">{c.tagline}</p>
        <p className="mt-auto pt-4 text-sm font-medium text-neutral-900">
          睇合集{" "}
          <span className="inline-block transition-transform group-hover:translate-x-1">
            →
          </span>
        </p>
      </div>
    </Link>
  );
}

export default function CollectionsIndexPage() {
  const collections = getCollections();
  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <section className="bg-neutral-950 text-white">
        <div className="mx-auto max-w-6xl px-6 py-14 md:py-20">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-neutral-400">
            Curated Collections
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
            策展合集
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-neutral-300">
            唔想喺 111 種風格入面大海撈針？呢度係編輯精選嘅主題清單——每個合集只收最啱味嘅幾種風格，附真實案例、成本同工具建議。成個合集一條 link 就可以分享畀隊友、畫師或者甲方。
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {collections.map((c) => (
            <CollectionCard key={c.slug} slug={c.slug} />
          ))}
        </div>
        <div className="mt-12 flex flex-wrap gap-4">
          <Link
            href="/finder"
            className="border border-neutral-900 bg-neutral-900 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-neutral-700"
          >
            按用途找風格 →
          </Link>
          <Link
            href="/"
            className="border border-neutral-200 px-6 py-3 text-sm font-bold text-neutral-700 transition-colors hover:border-neutral-900"
          >
            ← 回首頁領域地圖
          </Link>
        </div>
      </section>
    </main>
  );
}
