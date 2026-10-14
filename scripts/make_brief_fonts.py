#!/usr/bin/env python3
"""为风格简报 PDF 生成「每风格一个」的中文字体子集（base64 JSON，供服务端按需懒加载）。

背景：pdfkit 在 Vercel serverless 生成含中文的 PDF 需要嵌入中文字体；
Noto Sans SC 全量 17MB 不可能随部署上传。按每个风格简报实际会出现的
字符子集化后约 20~60KB，base64 进 JSON 后仍 < 90KB，满足 Vercel
upload_file 单文件 argv 约 128KB 上限。

字符集合 = 路由 app/api/brief/[slug]/route.ts 实际渲染的全部文案：
FIXED（固定文案）+ ASCII 可打印字符 + 该风格的词条字段/案例/Viblab/相关风格名/Finder 策展 note。
改 route.ts 文案时必须同步改这里的 FIXED 并重跑本脚本。

用法：python3 scripts/make_brief_fonts.py
输出：data/brief-fonts/<slug>.json + data/brief-fonts/index.ts
"""
import base64
import copy
import io
import json
import os
import string
import sys

from fontTools import subset

ROOT = os.path.expanduser("~/workspace/art-style-atlas")
DATA = os.path.join(ROOT, "data")
OUT = os.path.join(DATA, "brief-fonts")
SRC_FONT = "/tmp/fonts/NotoSansSC-400.ttf"

# ---- 与 app/api/brief/[slug]/route.ts 的固定文案逐字对应 ----
# 精简版：固定中文字符控制在 ~90 个以内，子集 TTF 才能 < 90KB。
FIXED = [
    "风格图谱 Style Atlas",
    "风格简报 · 免费版",
    "免费版 FREE",
    "一眼看懂",
    "真实案例",
    "真实作品，非 AI 生成。图源 Wikimedia Commons（免费授权）。",
    "提示词",
    "把 [主体] 换成你的创作对象即可用。",
    "Viblab 实战",
    "在 Viblab 把",
    "做成可玩游戏：",
    "实战页",
    "来源",
    "本文来源：",
    "相关风格",
    "适合用途",
    "类型",
    "年代",
    "谱系",
    "领域",
    "又称：",
    "授权：",
    "链接：",
    "代表作",
    "风格图谱 · 免费版（含水印）",
    "第",
    "页",
    "、",
    "完整版（去水印）即将上线，敬请期待。",
]


def load_json(fn):
    with open(os.path.join(DATA, fn), encoding="utf-8") as f:
        return json.load(f)


def main():
    if not os.path.exists(SRC_FONT):
        sys.exit(f"缺少字体文件 {SRC_FONT}，先下载 Noto Sans SC 并实例化为 400 字重静态 TTF")

    concepts = []
    lineages = {}
    domains = {}
    for fn in ("lexicon.json", "lexicon-new.json", "lexicon-new2.json"):
        d = load_json(fn)
        concepts.extend(d.get("concepts", []))
        for l in d.get("lineages", []):
            lineages[l["slug"]] = l
        for dm in d.get("domains", []):
            domains[dm["slug"]] = dm

    cases = {}
    for fn in ("cases.json", "cases2.json"):
        cases.update(load_json(fn))

    viblab = load_json("viblab-links.json")
    finder = load_json("finder.json").get("useCases", [])
    # slug -> [(useCaseNameCn, note)]
    slug_usecases: dict[str, list[tuple[str, str]]] = {}
    for uc in finder:
        for s in uc.get("styles", []):
            slug_usecases.setdefault(s["slug"], []).append((uc["nameCn"], s.get("note", "")))

    by_slug = {c["slug"]: c for c in concepts}
    fixed_chars = "".join(FIXED) + string.printable

    os.makedirs(OUT, exist_ok=True)

    # 字体只解析一次，每风格 deepcopy 后再 subset（比重复 load_font 快）
    base_font = subset.load_font(SRC_FONT, subset.Options())

    total = 0
    biggest = ("", 0)
    for c in concepts:
        slug = c["slug"]
        chars = set(fixed_chars)
        for f in (
            c.get("nameCn", ""),
            c.get("nameEn", ""),
            c.get("aliases", ""),
            c.get("type", ""),
            c.get("era", ""),
        ):
            chars.update(f)
        lin = lineages.get(c.get("lineageSlug", ""), {})
        dom = domains.get(lin.get("domainSlug", ""), {})
        chars.update(lin.get("nameCn", ""))
        chars.update(dom.get("nameCn", ""))
        for kp in c.get("keyPoints") or []:
            chars.update(kp)
        chars.update(c.get("promptTemplate", "") or "")
        for rc in cases.get(slug, []):
            for f in (
                rc.get("title", ""),
                rc.get("creator", ""),
                rc.get("year", ""),
                rc.get("license", ""),
                rc.get("note", ""),
            ):
                chars.update(f)
        vl = viblab.get(slug)
        if vl:
            chars.update(vl.get("styleName", ""))
            for g in vl.get("guides", []):
                chars.update(g.get("label", ""))
                chars.update(g.get("note", ""))
        for rs in c.get("relatedSlugs") or []:
            r = by_slug.get(rs)
            if r:
                chars.update(r.get("nameCn", ""))
                chars.update(r.get("nameEn", ""))
        for uname, note in slug_usecases.get(slug, []):
            chars.update(uname)
            chars.update(note)

        opts = subset.Options()
        opts.no_hinting = True
        font = copy.deepcopy(base_font)
        ss = subset.Subsetter(opts)
        ss.populate(text="".join(sorted(chars)))
        ss.subset(font)
        # WOFF 封装：pdfkit 的 fontkit 可解码，体积比 TTF 小 ~30-50%，
        # 保证 base64 后 < 90KB（Vercel upload_file argv 约 128KB 上限）
        font.flavor = "woff"
        buf = io.BytesIO()
        font.save(buf)
        ttf = buf.getvalue()

        payload = json.dumps({"font": base64.b64encode(ttf).decode()}, ensure_ascii=False)
        if len(payload.encode("utf-8")) >= 90_000:
            sys.exit(f"超限：{slug} 子集 JSON {len(payload)} 字节 ≥ 90KB，需精简简报内容")
        with open(os.path.join(OUT, f"{slug}.json"), "w", encoding="utf-8") as f:
            f.write(payload)
        total += len(payload.encode("utf-8"))
        if len(payload) > biggest[1]:
            biggest = (slug, len(payload))

    # 生成懒加载索引：111 个静态 import，webpack 各自 code-split，请求时只加载一个
    lines = [
        "// 由 scripts/make_brief_fonts.py 自动生成，请勿手改。",
        "// 风格简报 PDF 用的中文字体子集（每风格一个 base64 JSON），按需懒加载。",
        "const loaders: Record<string, () => Promise<{ default: { font: string } }>> = {",
    ]
    for c in concepts:
        slug = c["slug"]
        lines.append(f'  "{slug}": () => import("./{slug}.json"),')
    lines += [
        "};",
        "",
        "export function getBriefFontLoader(slug: string) {",
        "  return loaders[slug];",
        "}",
        "",
        "export function hasBriefFont(slug: string) {",
        "  return slug in loaders;",
        "}",
        "",
    ]
    with open(os.path.join(OUT, "index.ts"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"{len(concepts)} 个字体子集已生成：{OUT}")
    print(f"合计 {total / 1024:.0f} KB，最大 {biggest[0]} {biggest[1] / 1024:.1f} KB")


if __name__ == "__main__":
    main()
