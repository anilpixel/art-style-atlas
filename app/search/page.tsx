import Link from "next/link";
import Image from "next/image";
import {
  searchConcepts,
  getFinderCardImage,
  getFinderUseCases,
  type SearchHit,
} from "@/lib/lexicon";
import SearchBox from "@/components/SearchBox";
import { connection } from "next/server";

export const instant = false;

const matchLabel: Record<SearchHit["matchKind"], string> = {
  name: "名称匹配",
  alias: "别名匹配",
  usage: "用途匹配",
  feature: "特征匹配",
};

function ResultCard({ hit }: { hit: SearchHit }) {
  const card = getFinderCardImage(hit.slug);
  return (
    <Link
      key={hit.slug}
      href={`/concept/${hit.slug}`}
      className="group flex flex-col overflow-hidden border border-neutral-200 bg-white transition-all hover:-translate-y-1 hover:border-neutral-900 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
        {card.isAi ? (
          <Image
            src={card.src}
            alt={hit.nameCn}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.src}
            alt={hit.nameCn}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        {card.isAi && (
          <span className="absolute left-3 top-3 bg-black/70 px-2 py-1 font-mono text-[10px] text-white">
            AI 复现示意
          </span>
        )}
        <span className="absolute bottom-3 left-3 bg-white/90 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-neutral-700">
          {matchLabel[hit.matchKind]}
          {hit.matchedUse ? ` · ${hit.matchedUse}` : ""}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="font-bold group-hover:underline underline-offset-4">
          {hit.nameCn}
        </div>
        <div className="font-mono text-xs text-neutral-500 mt-1 truncate">
          {hit.nameEn}
        </div>
        {hit.matchNote && (
          <p className="mt-2 text-xs leading-5 text-neutral-600">{hit.matchNote}</p>
        )}
      </div>
    </Link>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await connection();
  const { q } = await searchParams;
  const results = q ? await searchConcepts(q) : [];
  const useCases = getFinderUseCases();

  // 命中的用途（去重，链向 finder 策展页）
  const matchedUses: { useCn: string; useKey: string }[] = [];
  for (const r of results) {
    if (r.matchedUse && r.matchedUseKey && !matchedUses.some((u) => u.useKey === r.matchedUseKey)) {
      matchedUses.push({ useCn: r.matchedUse, useKey: r.matchedUseKey });
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-neutral-500 mb-2">
        Search · 搜索
      </p>
      <h1 className="text-3xl font-bold mb-8">搜索风格</h1>
      <div className="max-w-xl mb-4">
        <SearchBox big />
      </div>
      <p className="text-xs text-neutral-400 mb-10">
        支持风格名，也支持用途词——试试：恐怖游戏、复古、可爱、国风、科幻
      </p>

      {q && results.length > 0 && (
        <p className="text-sm text-neutral-500 mb-6">
          「{q}」找到 {results.length} 个结果
        </p>
      )}

      {q && matchedUses.length > 0 && (
        <div className="mb-8 border border-neutral-900 bg-neutral-950 p-5 text-white">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-400">
            按用途找
          </p>
          <p className="mt-2 text-sm leading-7 text-neutral-300">
            「{q}」匹配到用途
            {matchedUses.map((u) => (
              <Link
                key={u.useKey}
                href={`/finder?u=${u.useKey}`}
                className="mx-1 font-bold text-white underline underline-offset-4 hover:text-neutral-300"
              >
                {u.useCn}
              </Link>
            ))}
            ——每个用途只推荐 6 个最对味的风格，去看看完整策展 →
          </p>
        </div>
      )}

      {q && results.length === 0 && (
        <div>
          <p className="text-neutral-400 mb-6">没有匹配的风格，换个关键词试试。</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-400 mb-3">
            或者按用途找
          </p>
          <div className="flex flex-wrap gap-2">
            {useCases.map((uc) => (
              <Link
                key={uc.key}
                href={`/finder?u=${uc.key}`}
                className="border border-neutral-200 px-4 py-2 text-sm font-bold text-neutral-700 transition-colors hover:border-neutral-900"
              >
                {uc.nameCn}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {results.map((c) => (
          <ResultCard key={c.slug} hit={c} />
        ))}
      </div>
    </div>
  );
}
