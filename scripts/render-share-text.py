#!/usr/bin/env python3
"""Pre-render Chinese text layers for the per-style OG share card.

Satori (next/og) cannot parse woff2, and an OTF CJK subset exceeds Vercel
upload_file's ~128KB argv limit, so Chinese text is pre-rendered here with PIL
(using system Noto Sans CJK SC) into small transparent PNGs. The OG route
(app/concept/[slug]/opengraph-image.tsx) composites them with <img> tags --
zero text nodes, zero embedded fonts.

Output (all 2x, displayed at half size by the route):
  public/share-text/text-{slug}.png   1400x880  crumb + nameCn + nameEn
  public/share-text/badge-real.png    600x88    "真实案例 REAL CASE"
  public/share-text/badge-ai.png      600x88    "AI 复现示意 AI DEMO"
  public/share-text/badge-atlas.png   600x88    "风格图谱 STYLE ATLAS"
  public/share-text/brand.png         1400x160  brand + host

Re-run after adding concepts or changing fixed labels.
"""
import glob
import json
import os

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.expanduser("~/workspace/art-style-atlas")
OUT = os.path.join(ROOT, "public", "share-text")
REG = "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"
BOLD = "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc"
IDX = 2  # Noto Sans CJK SC
HOST = "art-style-atlas-linayanses-projects.vercel.app"

WHITE = (255, 255, 255, 255)
GRAY = (163, 163, 163, 255)
DIM = (115, 115, 115, 255)
FAINT = (82, 82, 82, 255)


def font(path, size):
    return ImageFont.truetype(path, size, index=IDX)


def wrap(draw, text, fnt, max_w):
    """Greedy pixel-width wrap, max 2 lines (second line may overflow slightly)."""
    lines, cur = [], ""
    for ch in text:
        if draw.textlength(cur + ch, font=fnt) <= max_w:
            cur += ch
        else:
            lines.append(cur)
            cur = ch
            if len(lines) == 2:
                break
    if cur:
        lines.append(cur)
    return lines[:2]


def load_concepts():
    domains, lineages, raw = {}, {}, []
    for f in glob.glob(os.path.join(ROOT, "data", "lexicon*.json")):
        d = json.load(open(f, encoding="utf-8"))
        for x in d.get("domains", []):
            domains[x["slug"]] = x.get("nameCn", "")
        for x in d.get("lineages", []):
            lineages[x["slug"]] = (x.get("nameCn", ""), x.get("domainSlug", ""))
        raw.extend(d.get("concepts", []))
    concepts = []
    for c in raw:
        lin, dslug = lineages.get(c.get("lineageSlug", ""), ("", ""))
        # 兜底：词条自带的 domainSlug（lib/lexicon.ts 同样以词条字段为准）
        dslug = c.get("domainSlug", "") or dslug
        concepts.append(
            {
                "slug": c["slug"],
                "nameCn": c.get("nameCn", ""),
                "nameEn": c.get("nameEn", ""),
                "crumb": f"{domains.get(dslug, '')} · {lin}",
            }
        )
    return concepts


def render_text_card(c):
    img = Image.new("RGBA", (1400, 880), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # crumb
    fc = font(REG, 44)
    d.text((0, 8), c["crumb"], font=fc, fill=GRAY)
    # name: auto-fit, max 2 lines
    size = 192
    lines = [c["nameCn"]]
    while size > 112:
        f = font(BOLD, size)
        lines = wrap(d, c["nameCn"], f, 1160)
        if len(lines) <= 2 and all(
            d.textlength(ln, font=f) <= 1160 for ln in lines
        ):
            break
        size -= 8
    f = font(BOLD, size)
    y = 100
    lh = int(size * 1.25)
    for ln in lines:
        d.text((0, y), ln, font=f, fill=WHITE)
        y += lh
    # nameEn
    fe = font(REG, 56)
    d.text((0, y + 36), c["nameEn"].upper(), font=fe, fill=DIM)
    img.save(os.path.join(OUT, f"text-{c['slug']}.png"))


def render_label(name, text, size, fill, bold=False):
    img = Image.new("RGBA", (600, 88), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    f = font(BOLD if bold else REG, size)
    d.text((0, (88 - size) // 2 - 4), text, font=f, fill=fill)
    img.save(os.path.join(OUT, name))


def render_brand():
    img = Image.new("RGBA", (1400, 160), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    fb, fr = font(BOLD, 56), font(REG, 44)
    d.text((0, 0), "风格图谱", font=fb, fill=WHITE)
    w = d.textlength("风格图谱", font=fb)
    d.text((w + 32, 8), "STYLE ATLAS", font=fr, fill=GRAY)
    d.text((0, 92), HOST, font=font(REG, 40), fill=FAINT)
    img.save(os.path.join(OUT, "brand.png"))


def main():
    os.makedirs(OUT, exist_ok=True)
    concepts = load_concepts()
    print(f"{len(concepts)} concepts")
    for c in concepts:
        render_text_card(c)
    render_label("badge-real.png", "真实案例 REAL CASE", 44, WHITE)
    render_label("badge-ai.png", "AI 复现示意 AI DEMO", 44, WHITE)
    render_label("badge-atlas.png", "风格图谱 STYLE ATLAS", 44, WHITE)
    render_brand()
    total = sum(
        os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT)
    )
    biggest = max(
        (os.path.getsize(os.path.join(OUT, f)), f) for f in os.listdir(OUT)
    )
    print(f"{len(os.listdir(OUT))} files, {total/1024:.0f} KB total, "
          f"biggest {biggest[1]} {biggest[0]} bytes "
          f"(base64 ~{biggest[0]*4//3}, argv limit 131072)")


if __name__ == "__main__":
    main()
