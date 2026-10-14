"use client";

import { useState } from "react";

// P4-1：风格简报 PDF 导出（免费版，带水印）。
// 服务端 app/api/brief/[slug] 用 pdfkit 生成，这里只做"一键下载"：
// 取 blob → 触发下载（同源，无 CORS 问题）。
// P4-2：新增完整版（付费）对比区 —— 全部真实案例 / 去水印 / 推荐教程 / 可复制提示词。
// 支付链路（P4-3）上线前完整版仅展示、不开放下载，不编造价格。
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
    <div className="flex flex-col gap-4">
      <div className="border-2 border-neutral-900 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
        <div className="flex-1">
          <div className="font-bold text-base sm:text-lg leading-7">
            导出风格简报 PDF{" "}
            <span className="inline-block font-mono text-[10px] uppercase tracking-wider border border-neutral-300 text-neutral-500 px-2 py-0.5 ml-1 align-middle">
              免费版
            </span>
          </div>
          <div className="text-sm text-neutral-500 mt-1 leading-6">
            一页式简报：关键特征 + 真实案例（含授权）+ 可复制提示词，拿去跟搭档 /
            画师对齐。免费版含水印。
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

      <div className="border border-neutral-300 bg-neutral-50 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
        <div className="flex-1">
          <div className="font-bold text-base sm:text-lg leading-7">
            完整版简报{" "}
            <span className="inline-block font-mono text-[10px] uppercase tracking-wider border border-amber-400 text-amber-700 px-2 py-0.5 ml-1 align-middle">
              即将上线
            </span>
          </div>
          <ul className="text-sm text-neutral-500 mt-2 leading-6 list-disc pl-5">
            <li>全部真实案例（含授权标注），不只是前 6 条</li>
            <li>去水印，可直接发给甲方 / 画师 / 印成讲义</li>
            <li>推荐教程链接：跟着官方教程亲手复现这种风格</li>
            <li>可复制提示词，开箱即用</li>
          </ul>
        </div>
        <div className="shrink-0">
          <button
            disabled
            className="border-2 border-neutral-300 text-neutral-400 font-bold text-sm px-6 py-3 cursor-not-allowed"
            title="支付链路开发中"
          >
            即将上线
          </button>
        </div>
      </div>
    </div>
  );
}
