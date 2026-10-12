-- 艺术风格图谱 / Style Atlas — Vercel Postgres schema
-- 通过 /api/seed 导入 data/lexicon.json

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
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_lineages_domain ON lineages(domain_slug);
CREATE INDEX IF NOT EXISTS idx_concepts_lineage ON concepts(lineage_slug);
CREATE INDEX IF NOT EXISTS idx_concepts_name_cn ON concepts(name_cn);
CREATE INDEX IF NOT EXISTS idx_concepts_name_en ON concepts(name_en);
