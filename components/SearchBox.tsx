"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBox({ big = false }: { big?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim()) router.push(`/search?q=${encodeURIComponent(q.trim())}`);
      }}
      className={`flex items-center gap-0 border border-neutral-900 ${
        big ? "h-14 text-lg" : "h-10 text-sm"
      }`}
    >
      <span
        className={`px-4 font-mono text-neutral-400 select-none ${
          big ? "text-base" : "text-xs"
        }`}
      >
        /
      </span>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="搜索风格或用途，如：巴洛克、浮世绘、恐怖游戏、复古…"
        className="flex-1 h-full outline-none bg-transparent placeholder:text-neutral-400"
      />
      <button
        type="submit"
        className="h-full px-6 bg-neutral-900 text-white hover:bg-neutral-700 transition-colors"
      >
        搜索
      </button>
    </form>
  );
}
