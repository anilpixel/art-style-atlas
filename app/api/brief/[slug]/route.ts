import { connection } from "next/server";
import PDFDocument from "pdfkit";
import {
  getConcept,
  getConceptCases,
  getFinderUseCases,
  getViblabLink,
  type ConceptFull,
  type RealCase,
  type ViblabLink,
} from "@/lib/lexicon";
import { getBriefFontLoader } from "@/data/brief-fonts";
import { SITE_URL, VIBLAB_URL } from "@/lib/site";

// P4-1：风格简报 PDF 导出（免费版，带水印）。
// 服务端用 pdfkit 生成：中文用按需子集化的 Noto Sans SC（data/brief-fonts/<slug>.json，
// 由 scripts/make_brief_fonts.py 生成，单文件 < 90KB 以满足 Vercel 上传 argv 上限）。
// 文案中的中文字符必须全部出现在该脚本的 FIXED 列表里，改文案要同步重跑脚本。
export const instant = false;
export const maxDuration = 60;

const FONT = "brief-cn";
const INK = "#1a1a1a";
const GRAY = "#666666";
const FAINT = "#999999";
const LINK = "#1a56db";
const FREE_RED = "#b3261e";
const M = { top: 54, bottom: 60, left: 54, right: 54 };

/** 拉 Wikimedia 缩略图 embed 进 PDF：失败就降级为纯文字条目 */
async function fetchImage(url: string): Promise<Buffer | null> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.startsWith("image/")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0 || buf.length > 2_500_000) return null;
    return buf;
  } catch {
    return null;
  }
}

interface BriefInput {
  cases: RealCase[];
  images: Map<number, Buffer>;
  viblab: ViblabLink | null;
  useCases: { nameCn: string; note: string }[];
  relatedNames: string[];
}

function buildPdf(
  c: ConceptFull,
  fontBuf: Buffer,
  input: BriefInput
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: M,
      bufferPages: true,
      info: {
        Title: `${c.nameCn} ${c.nameEn} — 风格简报（免费版）`,
        Author: "风格图谱 Style Atlas",
        Subject: `风格图谱免费版简报：${c.nameCn}`,
      },
    });
    doc.registerFont(FONT, fontBuf);

    const W = doc.page.width;
    const H = doc.page.height;

    const h2 = (t: string) => {
      doc.moveDown(1.1);
      doc.font(FONT).fontSize(14).fillColor(INK).text(t);
      doc.moveDown(0.35);
    };
    const body = (t: string, size = 11, color = INK) => {
      doc.font(FONT).fontSize(size).fillColor(color).text(t);
    };
    const linkLine = (label: string, url: string, size = 9) => {
      doc
        .font(FONT)
        .fontSize(size)
        .fillColor(LINK)
        .text(`${label}${url}`, { link: url, underline: true });
    };
    /** 内容块放不下就先换页，避免图片/标题被拦腰截断 */
    const need = (h: number) => {
      if (doc.y + h > H - M.bottom) doc.addPage();
    };

    // ---------- 头部 ----------
    doc.font(FONT).fontSize(10).fillColor(FAINT).text("风格图谱 Style Atlas");
    doc.moveDown(0.25);
    doc.fontSize(10).fillColor(FREE_RED).text("风格简报 · 免费版");
    doc.moveDown(0.5);
    doc.fontSize(26).fillColor(INK).text(c.nameCn);
    doc.fontSize(12).fillColor(GRAY).text(c.nameEn);
    if (c.aliases) {
      doc.moveDown(0.25);
      doc.fontSize(10).fillColor(GRAY).text(`又称：${c.aliases}`);
    }
    doc.moveDown(0.6);
    const meta: [string, string][] = [
      ["类型", c.type],
      ["年代", c.era],
      ["谱系", c.lineageNameCn],
      ["领域", c.domainNameCn],
    ].filter(([, v]) => !!v) as [string, string][];
    if (meta.length > 0) {
      doc.font(FONT).fontSize(10).fillColor(INK);
      doc.text(meta.map(([k, v]) => `${k}：${v}`).join("\n"), {
        columns: 2,
        columnGap: 28,
      });
      doc.moveDown(0.4);
    }
    doc
      .strokeColor("#dddddd")
      .lineWidth(1)
      .moveTo(M.left, doc.y)
      .lineTo(W - M.right, doc.y)
      .stroke();

    // ---------- 一眼看懂 ----------
    const points = (c.keyPoints || []).slice(0, 5);
    if (points.length > 0) {
      h2("一眼看懂");
      points.forEach((k, i) => {
        doc.moveDown(0.15);
        body(`${i + 1}. ${k}`);
      });
    }

    // ---------- 适合用途（Finder 策展 note：含成本/工具提示） ----------
    if (input.useCases.length > 0) {
      h2("适合用途");
      input.useCases.slice(0, 3).forEach((u) => {
        doc.moveDown(0.15);
        body(`${u.nameCn}：${u.note}`, 10);
      });
    }

    // ---------- 真实案例 ----------
    if (input.cases.length > 0) {
      h2("真实案例");
      body("真实作品，非 AI 生成。图源 Wikimedia Commons（免费授权）。", 9, GRAY);
      doc.moveDown(0.5);
      input.cases.forEach((rc, i) => {
        const img = input.images.get(i);
        if (img) {
          need(210);
          try {
            doc.image(img, { fit: [300, 190], align: "center" });
          } catch {
            /* 坏图就跳过，保留文字 */
          }
          doc.moveDown(0.4);
        }
        need(64);
        doc.font(FONT).fontSize(12).fillColor(INK).text(rc.title);
        const metaLine = [rc.creator, rc.year].filter(Boolean).join(" · ");
        if (metaLine) body(metaLine, 9, GRAY);
        if (rc.kind === "work") body("代表作", 9, GRAY);
        if (rc.license) body(`授权：${rc.license}`, 9, GRAY);
        if (rc.note) {
          doc.moveDown(0.15);
          body(rc.note, 10);
        }
        if (rc.url) {
          doc.moveDown(0.15);
          linkLine("链接：", rc.url);
        }
        doc.moveDown(0.9);
      });
    }

    // ---------- 提示词 ----------
    if (c.promptTemplate) {
      h2("提示词");
      const pw = W - M.left - M.right;
      const pad = 12;
      doc.font(FONT).fontSize(10);
      const ph =
        doc.heightOfString(c.promptTemplate, { width: pw - pad * 2 }) + pad * 2;
      need(ph + 24);
      const by = doc.y;
      doc.save();
      doc.rect(M.left, by, pw, ph).fill("#f7f7f7");
      doc.restore();
      doc.rect(M.left, by, pw, ph).strokeColor(INK).lineWidth(1).stroke();
      doc
        .font(FONT)
        .fontSize(10)
        .fillColor(INK)
        .text(c.promptTemplate, M.left + pad, by + pad, {
          width: pw - pad * 2,
        });
      doc.y = by + ph;
      doc.moveDown(0.4);
      body("把 [主体] 换成你的创作对象即可用。", 9, GRAY);
    }

    // ---------- Viblab 实战（仅 6 个 1:1 对应的游戏词条） ----------
    if (input.viblab) {
      const vl = input.viblab;
      h2("Viblab 实战");
      body(`在 Viblab 把${c.nameCn}做成可玩游戏：`, 10);
      doc.moveDown(0.3);
      const styleUrl = `${VIBLAB_URL}/styles/${vl.styleSlug}`;
      doc
        .font(FONT)
        .fontSize(11)
        .fillColor(LINK)
        .text(`${vl.styleName} 实战页`, { link: styleUrl, underline: true });
      vl.guides.slice(0, 4).forEach((g) => {
        doc.moveDown(0.3);
        body(`· ${g.label}`, 10);
        linkLine("链接：", `${VIBLAB_URL}/guides/${g.slug}`);
      });
      doc.moveDown(0.3);
    }

    // ---------- 来源 ----------
    if (c.source) {
      h2("来源");
      body("本文来源：", 10);
      linkLine("", c.source, 10);
    }

    // ---------- 相关风格 ----------
    if (input.relatedNames.length > 0) {
      h2("相关风格");
      body(input.relatedNames.join("、"), 10);
    }

    // ---------- 结尾：完整版预告 + 回链 ----------
    doc.moveDown(1.6);
    doc
      .font(FONT)
      .fontSize(9)
      .fillColor(FAINT)
      .text("完整版（去水印）即将上线，敬请期待。", { align: "center" });
    doc.moveDown(0.6);
    const backUrl = `${SITE_URL}/concept/${c.slug}`;
    doc.font(FONT).fontSize(8).fillColor(LINK).text(backUrl, {
      align: "center",
      link: backUrl,
    });

    // 每页铬：内容全部画完后，逐页补斜向"免费版 FREE"水印 + 页脚。
    // 不能在 pageAdded 里画：handler 内再调 doc.text() 会重入 pdfkit 的
    // LineWrapper（this._wrapper 复用）导致 Maximum call stack size exceeded。
    const { count } = doc.bufferedPageRange();
    for (let i = 0; i < count; i++) {
      doc.switchToPage(i);
      const pw = doc.page.width;
      const ph = doc.page.height;
      doc.save();
      doc.opacity(0.07);
      doc.fillColor(INK);
      doc.font(FONT).fontSize(72);
      doc.rotate(30, { origin: [pw / 2, ph / 2] });
      doc.text("免费版 FREE", 0, ph / 2 - 60, { width: pw, align: "center" });
      doc.restore();
      doc.save();
      doc.font(FONT).fontSize(8).fillColor(FAINT);
      doc.text("风格图谱 · 免费版（含水印）", M.left, ph - 38, {
        width: pw - M.left - M.right,
      });
      doc.text(`第 ${i + 1} 页`, M.left, ph - 38, {
        width: pw - M.left - M.right,
        align: "right",
      });
      doc.restore();
    }

    const chunks: Buffer[] = [];
    doc.on("data", (d: Buffer) => chunks.push(d));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  await connection();
  const { slug } = await params;

  const c = await getConcept(slug);
  if (!c) return new Response("style not found", { status: 404 });
  const loader = getBriefFontLoader(slug);
  if (!loader)
    return new Response("brief font not available", { status: 500 });

  const cases = getConceptCases(slug).slice(0, 6);
  const viblab = getViblabLink(slug);
  const useCases: { nameCn: string; note: string }[] = [];
  for (const uc of getFinderUseCases()) {
    const hit = uc.styles.find((s) => s.slug === slug);
    if (hit) useCases.push({ nameCn: uc.nameCn, note: hit.note });
  }
  const related = (
    await Promise.all((c.relatedSlugs || []).map((s) => getConcept(s)))
  ).filter((r): r is ConceptFull => !!r);

  // 字体子集与案例图并行加载
  const imageJobs = cases
    .map((rc, i) => ({ rc, i }))
    .filter(({ rc }) => rc.kind === "image" && rc.img)
    .slice(0, 4);
  const [fontMod, ...imgBufs] = await Promise.all([
    loader(),
    ...imageJobs.map(({ rc }) => fetchImage(rc.img!)),
  ]);
  const images = new Map<number, Buffer>();
  imageJobs.forEach(({ i }, j) => {
    const b = imgBufs[j];
    if (b) images.set(i, b);
  });

  const pdf = await buildPdf(c, Buffer.from(fontMod.default.font, "base64"), {
    cases,
    images,
    viblab,
    useCases,
    relatedNames: related.map((r) => r.nameCn),
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${slug}-brief-free.pdf"`,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
