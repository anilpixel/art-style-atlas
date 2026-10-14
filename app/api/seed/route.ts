import { NextResponse } from "next/server";
import { getPool, isDbConfigured } from "@/lib/db";
import seedBase from "@/data/lexicon.json";
import seedNew from "@/data/lexicon-new.json";
import seedNew2 from "@/data/lexicon-new2.json";

const seed = {
  domains: (seedBase as { domains: unknown[] }).domains,
  lineages: (seedBase as { lineages: unknown[] }).lineages,
  concepts: [
    ...(seedBase as { concepts: unknown[] }).concepts,
    ...(seedNew as { concepts: unknown[] }).concepts,
    ...(seedNew2 as { concepts: unknown[] }).concepts,
  ],
};

export const instant = false;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS domains (
  slug TEXT PRIMARY KEY,
  index_no INTEGER NOT NULL,
  name_cn TEXT NOT NULL,
  name_en TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS lineages (
  slug TEXT PRIMARY KEY,
  domain_slug TEXT NOT NULL REFERENCES domains(slug) ON DELETE CASCADE,
  index_no INTEGER NOT NULL,
  name_cn TEXT NOT NULL,
  name_en TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS concepts (
  slug TEXT PRIMARY KEY,
  lineage_slug TEXT NOT NULL REFERENCES lineages(slug) ON DELETE CASCADE,
  name_cn TEXT NOT NULL,
  name_en TEXT NOT NULL,
  aliases TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT '',
  era TEXT NOT NULL DEFAULT '',
  medium_category TEXT NOT NULL DEFAULT '',
  medium TEXT NOT NULL DEFAULT '',
  technique TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '',
  light TEXT NOT NULL DEFAULT '',
  composition TEXT NOT NULL DEFAULT '',
  texture TEXT NOT NULL DEFAULT '',
  features TEXT NOT NULL DEFAULT '',
  key_points JSONB NOT NULL DEFAULT '[]',
  prompt_template TEXT NOT NULL DEFAULT '',
  related_slugs JSONB NOT NULL DEFAULT '[]',
  image TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_lineages_domain ON lineages(domain_slug);
CREATE INDEX IF NOT EXISTS idx_concepts_lineage ON concepts(lineage_slug);
CREATE INDEX IF NOT EXISTS idx_concepts_name_cn ON concepts(name_cn);
CREATE INDEX IF NOT EXISTS idx_concepts_name_en ON concepts(name_en);
`;

/**
 * POST /api/seed —— 建表并导入内置数据
 * 幂等：concepts 表已有数据时直接跳过（除非带 ?force=1&token=SEED_TOKEN）
 */
export async function POST(request: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { ok: false, error: "数据库未配置：请在 Vercel 为项目链接 Postgres 后重试" },
      { status: 500 }
    );
  }
  const url = new URL(request.url);
  const force = url.searchParams.get("force") === "1";
  const token = url.searchParams.get("token");
  const seedToken = process.env.SEED_TOKEN;

  try {
    const pool = getPool()!;

    // 先建表（新库表可能还不存在），再查现有数据量
    await pool.query(SCHEMA);
    // 已有库补列（P1-5 资料来源）：幂等
    await pool.query(
      `ALTER TABLE concepts ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT ''`
    );

    const { rows } = await pool.sql`SELECT COUNT(*)::int AS n FROM concepts`;
    if (rows[0].n > 0 && !force) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        message: `concepts 表已有 ${rows[0].n} 条数据，跳过导入`,
      });
    }
    if (force && seedToken && token !== seedToken) {
      return NextResponse.json({ ok: false, error: "token 无效" }, { status: 403 });
    }

    const data = seed as {
      domains: { slug: string; indexNo: number; nameCn: string; nameEn: string }[];
      lineages: { slug: string; domainSlug: string; indexNo: number; nameCn: string; nameEn: string }[];
      concepts: {
        slug: string; lineageSlug: string; nameCn: string; nameEn: string; aliases: string;
        type: string; era: string; mediumCategory: string; medium: string;
        technique: string; color: string; light: string; composition: string; texture: string;
        features: string; keyPoints: string[]; promptTemplate: string;
        relatedSlugs: string[]; image: string; source?: string;
      }[];
    };

    for (const d of data.domains) {
      await pool.sql`INSERT INTO domains (slug, index_no, name_cn, name_en)
        VALUES (${d.slug}, ${d.indexNo}, ${d.nameCn}, ${d.nameEn})
        ON CONFLICT (slug) DO UPDATE SET index_no=EXCLUDED.index_no, name_cn=EXCLUDED.name_cn, name_en=EXCLUDED.name_en`;
    }
    for (const l of data.lineages) {
      await pool.sql`INSERT INTO lineages (slug, domain_slug, index_no, name_cn, name_en)
        VALUES (${l.slug}, ${l.domainSlug}, ${l.indexNo}, ${l.nameCn}, ${l.nameEn})
        ON CONFLICT (slug) DO UPDATE SET domain_slug=EXCLUDED.domain_slug, index_no=EXCLUDED.index_no, name_cn=EXCLUDED.name_cn, name_en=EXCLUDED.name_en`;
    }
    let i = 0;
    for (const c of data.concepts) {
      await pool.sql`INSERT INTO concepts
        (slug, lineage_slug, name_cn, name_en, aliases, type, era, medium_category, medium, technique, color,
         light, composition, texture, features, key_points, prompt_template, related_slugs, image, source, sort_order)
        VALUES (${c.slug}, ${c.lineageSlug}, ${c.nameCn}, ${c.nameEn}, ${c.aliases ?? ""}, ${c.type ?? ""}, ${c.era ?? ""},
          ${c.mediumCategory ?? ""}, ${c.medium ?? ""}, ${c.technique ?? ""}, ${c.color ?? ""},
          ${c.light ?? ""}, ${c.composition ?? ""}, ${c.texture ?? ""},
          ${c.features ?? ""}, ${JSON.stringify(c.keyPoints ?? [])}, ${c.promptTemplate ?? ""}, ${JSON.stringify(c.relatedSlugs ?? [])},
          ${c.image ?? ""}, ${c.source ?? ""}, ${i})
        ON CONFLICT (slug) DO UPDATE SET lineage_slug=EXCLUDED.lineage_slug, name_cn=EXCLUDED.name_cn,
          name_en=EXCLUDED.name_en, aliases=EXCLUDED.aliases, type=EXCLUDED.type, era=EXCLUDED.era,
          medium_category=EXCLUDED.medium_category, medium=EXCLUDED.medium, technique=EXCLUDED.technique,
          color=EXCLUDED.color, light=EXCLUDED.light, composition=EXCLUDED.composition, texture=EXCLUDED.texture,
          features=EXCLUDED.features, key_points=EXCLUDED.key_points, prompt_template=EXCLUDED.prompt_template,
          related_slugs=EXCLUDED.related_slugs, image=EXCLUDED.image, source=EXCLUDED.source, sort_order=EXCLUDED.sort_order`;
      i++;
    }

    return NextResponse.json({
      ok: true,
      imported: {
        domains: data.domains.length,
        lineages: data.lineages.length,
        concepts: data.concepts.length,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
