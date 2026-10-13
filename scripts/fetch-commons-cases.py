#!/usr/bin/env python3
"""从 Wikimedia Commons 按关键词拉取免费授权图片候选，供人工精选后写入 data/cases.json。

用法: python3 scripts/fetch-commons-cases.py "ukiyo-e" "Hokusai wave"
输出: scripts/commons-raw/<slug>.json（候选列表，人工挑选用）
只使用 Public Domain / CC-BY / CC-BY-SA 授权的图片。
"""
import json, os, sys, urllib.parse, urllib.request

OUT = os.path.join(os.path.dirname(__file__), "commons-raw")
os.makedirs(OUT, exist_ok=True)

OK_LICENSES = ("public domain", "cc-by-sa", "cc-by", "cc0")

def fetch(query, limit=12):
    params = {
        "action": "query", "format": "json",
        "generator": "search", "gsrsearch": f"filetype:bitmap {query}",
        "gsrnamespace": 6, "gsrlimit": limit,
        "prop": "imageinfo", "iiprop": "url|extmetadata|size",
        "iiurlwidth": 800,
    }
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": "StyleAtlas/1.0 (art reference tool)"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)

def main():
    slug, query = sys.argv[1], " ".join(sys.argv[2:])
    data = fetch(query)
    out = []
    for page in (data.get("query") or {}).get("pages", {}).values():
        ii = (page.get("imageinfo") or [{}])[0]
        meta = ii.get("extmetadata") or {}
        lic = (meta.get("LicenseShortName") or {}).get("value", "").lower()
        if not any(k in lic for k in OK_LICENSES):
            continue
        artist = (meta.get("Artist") or {}).get("value", "")
        # 去掉 HTML 标签
        import re
        artist = re.sub(r"<[^>]+>", "", artist).strip()[:80]
        out.append({
            "title": page.get("title", "").replace("File:", ""),
            "pageUrl": ii.get("descriptionurl", ""),
            "img": ii.get("thumburl") or ii.get("url"),
            "license": (meta.get("LicenseShortName") or {}).get("value", ""),
            "artist": artist,
        })
    path = os.path.join(OUT, f"{slug}.json")
    json.dump(out, open(path, "w"), ensure_ascii=False, indent=2)
    print(f"{slug}: {len(out)} candidates -> {path}")

if __name__ == "__main__":
    main()
