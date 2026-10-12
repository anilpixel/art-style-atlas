import Link from "next/link";
import Image from "next/image";
import { getRandomConcept } from "@/lib/lexicon";
import CopyButton from "@/components/CopyButton";
import NextButton from "@/components/NextButton";
import { connection } from "next/server";

export const instant = false;

export default async function ExplorePage() {
  await connection();
  const c = await getRandomConcept();

  if (!c) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center text-neutral-500">
        图谱还是空的，数据正在整理中…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-neutral-500 mb-2">
        Random · 随便逛逛
      </p>
      <h1 className="text-3xl font-bold mb-8">今天试试这个风格</h1>

      <div className="border-2 border-neutral-900">
        <div className="aspect-[16/9] bg-neutral-100 relative overflow-hidden">
          {c.image ? (
            <Image
              src={c.image}
              alt={c.nameCn}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 60vw"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-mono text-xs text-neutral-400">
              NO IMAGE
            </div>
          )}
        </div>
        <div className="p-8">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-neutral-500 mb-2">
            {c.domainNameCn} / {c.lineageNameCn}
          </div>
          <h2 className="text-3xl font-bold mb-1">{c.nameCn}</h2>
          <p className="font-mono text-sm text-neutral-500 mb-6">{c.nameEn}</p>
          {c.features && (
            <p className="leading-8 text-neutral-700 mb-6">{c.features}</p>
          )}
          {c.promptTemplate && (
            <div className="border border-neutral-200 bg-neutral-50 p-5 mb-6">
              <p className="leading-8 whitespace-pre-wrap text-[15px]">
                {c.promptTemplate}
              </p>
            </div>
          )}
          <div className="flex flex-wrap gap-4">
            {c.promptTemplate && <CopyButton text={c.promptTemplate} />}
            <Link
              href={`/concept/${c.slug}`}
              className="px-8 h-12 inline-flex items-center border border-neutral-900 hover:bg-neutral-100 transition-colors"
            >
              查看详情
            </Link>
            <NextButton />
          </div>
        </div>
      </div>
      <p className="font-mono text-xs text-neutral-400 mt-6 text-center">
        TIP — 把 [主体] 换成你想画的内容，直接粘贴进 AI 绘画工具
      </p>
    </div>
  );
}
