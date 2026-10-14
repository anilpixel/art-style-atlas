"use client";

import { useState } from "react";

// P3-2：一键生成分享图。
// 分享卡由服务端 app/concept/[slug]/opengraph-image.tsx 统一渲染，
// 这里只做"一键取图"：下载 PNG / 复制图片到剪贴板（同源，无 CORS 问题）。
export default function ShareCardButton({
  slug,
  nameCn,
}: {
  slug: string;
  nameCn: string;
}) {
  const [status, setStatus] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [copied, setCopied] = useState(false);
  const url = `/concept/${slug}/opengraph-image`;

  async function fetchCard(): Promise<Blob> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`card ${res.status}`);
    return await res.blob();
  }

  async function download() {
    setStatus("busy");
    try {
      const blob = await fetchCard();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `style-atlas-${slug}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  async function copyImage() {
    setCopied(false);
    try {
      const blob = await fetchCard();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopied(true);
    } catch {
      setCopied(false);
      alert("复制失败，请改用下载分享卡");
    }
  }

  return (
    <div className="border-2 border-neutral-900 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
      <div className="flex-1">
        <div className="font-bold text-base sm:text-lg leading-7">
          把这张风格卡片发给搭档
        </div>
        <div className="text-sm text-neutral-500 mt-1 leading-6">
          1200 × 630 分享图：风格名 + 真实案例图 + 出处，微信群 / 朋友圈直接发。
        </div>
      </div>
      <div className="flex gap-3 shrink-0">
        <button
          onClick={download}
          disabled={status === "busy"}
          className="bg-neutral-900 text-white font-bold text-sm px-6 py-3 hover:bg-neutral-700 disabled:opacity-50 transition-colors cursor-pointer"
        >
          {status === "busy"
            ? "生成中…"
            : status === "done"
              ? "已下载 ✓"
              : status === "error"
                ? "重试下载"
                : "下载分享卡"}
        </button>
        <button
          onClick={copyImage}
          className="border border-neutral-900 font-bold text-sm px-6 py-3 hover:bg-neutral-100 transition-colors cursor-pointer"
        >
          {copied ? "已复制 ✓" : "复制图片"}
        </button>
      </div>
      <span className="sr-only">{nameCn} 分享卡片</span>
    </div>
  );
}
