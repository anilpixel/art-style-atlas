"use client";

import { useState } from "react";

// P4-1：风格简报 PDF 导出（免费版，带水印）。
// 服务端 app/api/brief/[slug] 用 pdfkit 生成，这里只做"一键下载"：
// 取 blob → 触发下载（同源，无 CORS 问题）。
export default function BriefPdfButton({
  slug,
  nameCn,
}: {
  slug: string;
  nameCn: string;
}) {
  const [status, setStatus] = useState<"idle" | "busy" | "done" | "error">(
    "idle"
  );

  async function download() {
    setStatus("busy");
    try {
      const res = await fetch(`/api/brief/${slug}`);
      if (!res.ok) throw new Error(`brief ${res.status}`);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${slug}-brief-free.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="border-2 border-neutral-900 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
      <div className="flex-1">
        <div className="font-bold text-base sm:text-lg leading-7">
          导出风格简报 PDF{" "}
          <span className="inline-block font-mono text-[10px] uppercase tracking-wider border border-neutral-300 text-neutral-500 px-2 py-0.5 ml-1 align-middle">
            免费版
          </span>
        </div>
        <div className="text-sm text-neutral-500 mt-1 leading-6">
          一页式简报：关键特征 + 真实案例（含授权）+ 可复制提示词，拿去跟搭档 / 画师对齐。免费版含水印。
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
                : "下载 PDF"}
        </button>
      </div>
      <span className="sr-only">{nameCn} 风格简报 PDF</span>
    </div>
  );
}
