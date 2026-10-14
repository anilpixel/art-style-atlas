import { ImageResponse } from "next/og";
import { connection } from "next/server";
import { headers } from "next/headers";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getConcept, getConceptCases } from "@/lib/lexicon";
import { SITE_URL } from "@/lib/site";

// P3-2：每风格独立的动态分享卡图（1200×630）。
// 品牌黑白编辑风：左文案（风格名/谱系/徽标）+ 右真实案例图。
//
// 实现说明：Satori 解析不了 woff2，而 OTF 格式的 CJK 子集 base64 后
// 超过 Vercel upload_file 单参数 ~128KB 上限，所以中文文案全部由
// scripts/render-share-text.py 用 PIL 预渲染为透明 PNG（public/share-text/），
// 这里只做 <img> 拼装 —— 零文本节点、零内嵌字体。
// 注意：图片路由不支持 export const instant，用 await connection()
// 保证按请求动态生成（Next.js 16.4 项目约定：动态页不用 export const dynamic）。
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** 图片可用性预检：Wikimedia 缩略图偶发 404，坏图会导致整张卡 500，先验再画 */
async function imageOk(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

/** 自引用基地址（Satori 的 <img> 必须 absolute URL；按请求 host 拼，本地/线上都对） */
async function selfBase(): Promise<string> {
  const host = (await headers()).get("host") || "";
  if (host.includes("localhost") || host.includes("127.0.0.1")) return `http://${host}`;
  return `https://${host || SITE_URL.replace(/^https?:\/\//, "")}`;
}

/**
 * 预渲染文案 PNG → data URI（首选：读盘，无 HTTP、无 SSRF 问题，本地/线上一致）。
 * 读不到（如 serverless bundle 未收录 public/ 下该文件）则回退为自取 HTTP URL。
 */
async function pngSrc(base: string, name: string): Promise<string> {
  try {
    const buf = await readFile(join(process.cwd(), "public", "share-text", name));
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return `${base}/share-text/${name}`;
  }
}

export default async function StyleShareCard({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await connection();
  const { slug } = await params;
  const base = await selfBase();
  const src = (name: string) => pngSrc(base, name);

  const c = await getConcept(slug);
  if (!c) {
    const brand = await src("brand.png");
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0b0b0c",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brand} alt="风格图谱" style={{ width: 628, height: 72 }} />
        </div>
      ),
      { ...size }
    );
  }

  // 配图优先级：真实案例图 > AI 复现示意（带徽标）> 纯深色底
  const cases = getConceptCases(slug);
  const realImg = cases.find((rc) => rc.kind === "image" && rc.img)?.img;
  let img: string | null = null;
  let badge = "badge-atlas.png";
  if (realImg && (await imageOk(realImg))) {
    img = realImg;
    badge = "badge-real.png";
  } else if (c.image) {
    const ai = c.image.startsWith("http") ? c.image : `${SITE_URL}${c.image}`;
    if (await imageOk(ai)) {
      img = ai;
      badge = "badge-ai.png";
    }
  }

  const [textPng, badgePng, brandPng] = await Promise.all([
    src(`text-${c.slug}.png`),
    src(badge),
    src("brand.png"),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          background: "#0b0b0c",
        }}
      >
        {/* 左：预渲染文案层（628 = 700 列宽 - 72 左边距） */}
        <div
          style={{
            width: 700,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "64px 0 60px 72px",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={textPng}
            alt={`${c.nameCn} ${c.nameEn}`}
            style={{ width: 628, height: 394 }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={badgePng} alt="" style={{ width: 300, height: 44 }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={brandPng}
              alt="风格图谱 Style Atlas"
              style={{ width: 628, height: 72 }}
            />
          </div>
        </div>
        {/* 右：配图 */}
        <div
          style={{
            width: 500,
            height: "100%",
            display: "flex",
            background: "#141414",
          }}
        >
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img}
              alt={c.nameCn}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : null}
        </div>
      </div>
    ),
    { ...size }
  );
}
