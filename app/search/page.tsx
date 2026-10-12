import Link from "next/link";
import Image from "next/image";
import { searchConcepts } from "@/lib/lexicon";
import SearchBox from "@/components/SearchBox";
import { connection } from "next/server";

export const instant = false;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await connection();
  const { q } = await searchParams;
  const results = q ? await searchConcepts(q) : [];

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-neutral-500 mb-2">
        Search · 搜索
      </p>
      <h1 className="text-3xl font-bold mb-8">搜索风格</h1>
      <div className="max-w-xl mb-10">
        <SearchBox big />
      </div>

      {q && (
        <p className="text-sm text-neutral-500 mb-6">
          「{q}」找到 {results.length} 个结果
        </p>
      )}

      {q && results.length === 0 && (
        <p className="text-neutral-400">没有匹配的风格，换个关键词试试。</p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {results.map((c) => (
          <Link
            key={c.slug}
            href={`/concept/${c.slug}`}
            className="group border border-neutral-200 hover:border-neutral-900 transition-colors"
          >
            <div className="aspect-[4/3] bg-neutral-100 relative overflow-hidden">
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
    </div>
  );
}
