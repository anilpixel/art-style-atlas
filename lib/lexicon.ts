import seedBase from "@/data/lexicon.json";
import seedNew from "@/data/lexicon-new.json";
import casesData from "@/data/cases.json";
import casesData2 from "@/data/cases2.json";
import { getPool } from "./db";

/* ============ 类型 ============ */

export interface Domain {
  slug: string;
  indexNo: number;
  nameCn: string;
  nameEn: string;
}

export interface Lineage {
  slug: string;
  domainSlug: string;
  indexNo: number;
  nameCn: string;
  nameEn: string;
}

export interface Concept {
  slug: string;
  lineageSlug: string;
  domainSlug: string;
  nameCn: string;
  nameEn: string;
  aliases: string;
  type: string;
  era: string;
  mediumCategory: string;
  medium: string;
  technique: string;
  color: string;
  light: string;
  composition: string;
  texture: string;
  features: string;
  keyPoints: string[];
  promptTemplate: string;
  relatedSlugs: string[];
  image: string;
}

export interface ConceptFull extends Concept {
  lineageNameCn: string;
  lineageNameEn: string;
  domainNameCn: string;
  domainNameEn: string;
}

interface SeedShape {
  domains: Domain[];
  lineages: Lineage[];
  concepts: Concept[];
}

const seedBaseTyped = seedBase as SeedShape;
const seedNewTyped = seedNew as { concepts: Concept[] };

export interface RealCase {
  kind: "image" | "work";
  title: string;
  creator?: string;
  year?: string;
  img?: string;
  url?: string;
  license?: string;
  note?: string;
}

const cases: Record<string, RealCase[]> = {
  ...(casesData as Record<string, RealCase[]>),
  ...(casesData2 as Record<string, RealCase[]>),
};

/** 真实案例：Wikimedia Commons 免费授权图片 + 代表作外链 */
export function getConceptCases(slug: string): RealCase[] {
  return cases[slug] ?? [];
}

/** 有真实案例的风格数量（首页/统计用） */
export function getCasedConceptCount(): number {
  return Object.keys(cases).length;
}

/** 内置数据：lexicon.json（30）+ lexicon-new.json（73+8）合并 */
const seed: SeedShape = {
  domains: seedBaseTyped.domains,
  lineages: seedBaseTyped.lineages,
  concepts: [...seedBaseTyped.concepts, ...seedNewTyped.concepts],
};

const byIndex = (a: { indexNo: number }, b: { indexNo: number }) =>
  a.indexNo - b.indexNo;

/* ============ 查询 ============ */

/**
 * 数据库查询包装：未配置数据库，或查询失败（表不存在、连接失败等）
 * 时，自动回退到内置 JSON 数据，保证页面永远可渲染。
 */
async function dbOr<T>(
  fn: (pool: NonNullable<ReturnType<typeof getPool>>) => Promise<T>,
  fallback: () => T | Promise<T>
): Promise<T> {
  try {
    const pool = getPool();
    if (!pool) return fallback();
    return await fn(pool);
  } catch {
    return fallback();
  }
}

const seedDomains = () => [...seed.domains].sort(byIndex);

export async function getDomains(): Promise<Domain[]> {
  return dbOr(async (pool) => {
    const { rows } = await pool.sql`
      SELECT slug, index_no AS "indexNo", name_cn AS "nameCn", name_en AS "nameEn"
      FROM domains ORDER BY index_no`;
    return rows as Domain[];
  }, seedDomains);
}

export async function getDomainDetail(slug: string): Promise<{
  domain: Domain;
  lineages: (Lineage & { concepts: Concept[] })[];
} | null> {
  return dbOr(async (pool) => {
    const dRes = await pool.sql`
      SELECT slug, index_no AS "indexNo", name_cn AS "nameCn", name_en AS "nameEn"
      FROM domains WHERE slug = ${slug}`;
    if (dRes.rows.length === 0) return null;
    const domain = dRes.rows[0] as Domain;
    const lRes = await pool.sql`
      SELECT slug, domain_slug AS "domainSlug", index_no AS "indexNo",
             name_cn AS "nameCn", name_en AS "nameEn"
      FROM lineages WHERE domain_slug = ${slug} ORDER BY index_no`;
    const lineages: (Lineage & { concepts: Concept[] })[] = [];
    for (const l of lRes.rows as Lineage[]) {
      const cRes = await pool.sql`
        SELECT c.slug, c.lineage_slug AS "lineageSlug", l.domain_slug AS "domainSlug",
               c.name_cn AS "nameCn", c.name_en AS "nameEn", c.type, c.era,
               c.medium_category AS "mediumCategory", c.medium, c.technique, c.color,
               c.light, c.composition, c.texture, c.aliases,
               c.features, c.key_points AS "keyPoints", c.prompt_template AS "promptTemplate",
               c.related_slugs AS "relatedSlugs", c.image
        FROM concepts c JOIN lineages l ON l.slug = c.lineage_slug
        WHERE c.lineage_slug = ${l.slug} ORDER BY c.sort_order`;
      lineages.push({ ...l, concepts: cRes.rows as Concept[] });
    }
    return { domain, lineages };
  }, () => {
    const domain = seed.domains.find((d) => d.slug === slug);
    if (!domain) return null;
    const lineages = seed.lineages
      .filter((l) => l.domainSlug === slug)
      .sort(byIndex)
      .map((l) => ({
        ...l,
        concepts: seed.concepts.filter((c) => c.lineageSlug === l.slug),
      }));
    return { domain, lineages };
  });
}

function conceptFullFromSeed(slug: string): ConceptFull | null {
  const c = seed.concepts.find((x) => x.slug === slug);
  if (!c) return null;
  const cc = c as unknown as Record<string, unknown>;
  for (const k of ["aliases", "light", "composition", "texture"])
    if (!(k in cc)) cc[k] = "";
  if (!("keyPoints" in cc)) cc["keyPoints"] = [];
  const lineage = seed.lineages.find((l) => l.slug === c.lineageSlug)!;
  const domain = seed.domains.find((d) => d.slug === lineage.domainSlug)!;
  return {
    ...c,
    lineageNameCn: lineage.nameCn,
    lineageNameEn: lineage.nameEn,
    domainNameCn: domain.nameCn,
    domainNameEn: domain.nameEn,
  };
}

export async function getConcept(slug: string): Promise<ConceptFull | null> {
  return dbOr(async (pool) => {
    const { rows } = await pool.sql`
      SELECT c.slug, c.lineage_slug AS "lineageSlug", l.domain_slug AS "domainSlug",
             c.name_cn AS "nameCn", c.name_en AS "nameEn", c.type, c.era,
             c.medium_category AS "mediumCategory", c.medium, c.technique, c.color,
             c.light, c.composition, c.texture, c.aliases,
             c.features, c.key_points AS "keyPoints", c.prompt_template AS "promptTemplate",
             c.related_slugs AS "relatedSlugs", c.image,
             l.name_cn AS "lineageNameCn", l.name_en AS "lineageNameEn",
             d.name_cn AS "domainNameCn", d.name_en AS "domainNameEn"
      FROM concepts c
      JOIN lineages l ON l.slug = c.lineage_slug
      JOIN domains d ON d.slug = l.domain_slug
      WHERE c.slug = ${slug}`;
    return (rows[0] as ConceptFull) ?? null;
  }, () => conceptFullFromSeed(slug));
}

export async function searchConcepts(q: string): Promise<Concept[]> {
  const keyword = q.trim().toLowerCase();
  if (!keyword) return [];
  const like = `%${q.trim()}%`;
  return dbOr(async (pool) => {
    const { rows } = await pool.sql`
      SELECT c.slug, c.lineage_slug AS "lineageSlug", l.domain_slug AS "domainSlug",
             c.name_cn AS "nameCn", c.name_en AS "nameEn", c.type, c.era,
             c.medium_category AS "mediumCategory", c.medium, c.technique, c.color,
             c.light, c.composition, c.texture, c.aliases,
             c.features, c.key_points AS "keyPoints", c.prompt_template AS "promptTemplate",
             c.related_slugs AS "relatedSlugs", c.image
      FROM concepts c JOIN lineages l ON l.slug = c.lineage_slug
      WHERE c.name_cn ILIKE ${like} OR c.name_en ILIKE ${like} OR c.features ILIKE ${like}
      ORDER BY c.sort_order LIMIT 30`;
    return rows as Concept[];
  }, () =>
    seed.concepts.filter(
      (c) =>
        c.nameCn.includes(q.trim()) ||
        c.nameEn.toLowerCase().includes(keyword) ||
        c.features.includes(q.trim())
    )
  );
}

export async function getRandomConcept(): Promise<ConceptFull | null> {
  return dbOr(async (pool) => {
    const { rows } = await pool.sql`
      SELECT c.slug, c.lineage_slug AS "lineageSlug", l.domain_slug AS "domainSlug",
             c.name_cn AS "nameCn", c.name_en AS "nameEn", c.type, c.era,
             c.medium_category AS "mediumCategory", c.medium, c.technique, c.color,
             c.light, c.composition, c.texture, c.aliases,
             c.features, c.key_points AS "keyPoints", c.prompt_template AS "promptTemplate",
             c.related_slugs AS "relatedSlugs", c.image,
             l.name_cn AS "lineageNameCn", l.name_en AS "lineageNameEn",
             d.name_cn AS "domainNameCn", d.name_en AS "domainNameEn"
      FROM concepts c
      JOIN lineages l ON l.slug = c.lineage_slug
      JOIN domains d ON d.slug = l.domain_slug
      ORDER BY RANDOM() LIMIT 1`;
    return (rows[0] as ConceptFull) ?? null;
  }, () => {
    const c = seed.concepts[Math.floor(Math.random() * seed.concepts.length)];
    return c ? conceptFullFromSeed(c.slug) : null;
  });
}

export async function getAllConceptSlugs(): Promise<string[]> {
  return dbOr(async (pool) => {
    const { rows } = await pool.sql`SELECT slug FROM concepts ORDER BY sort_order`;
    return rows.map((r) => r.slug as string);
  }, () => seed.concepts.map((c) => c.slug));
}

export function getConceptCount(): number {
  return seed.concepts.length;
}

export interface DomainOverview extends Domain {
  lineageCount: number;
  conceptCount: number;
  image: string;
}

/** 每个领域在首页卡片上的代表图 */
export const DOMAIN_IMAGES: Record<string, string> = {
  "western-art": "/images/styles/baroque.jpg",
  "eastern-traditions": "/images/styles/ukiyo-e.jpg",
  illustration: "/images/styles/watercolor.jpg",
  "comics-anime": "/images/styles/anime.jpg",
  "graphic-design": "/images/styles/swiss-style.jpg",
  photography: "/images/styles/film-35mm.jpg",
  "film-video": "/images/styles/three-strip-technicolor.jpg",
  "cg-3d-games": "/images/styles/low-poly.jpg",
  "animation-motion": "/images/styles/cel-animation.jpg",
  "ui-ux": "/images/styles/liquid-glass-ui.jpg",
  "pop-subculture": "/images/styles/cyberpunk.jpg",
  architecture: "/images/styles/art-nouveau-architecture.jpg",
  "materials-products": "/images/styles/cloisonne-enamel.jpg",
};

/** 首页精选风格 */
export const FEATURED_SLUGS = [
  "ukiyo-e",
  "cyberpunk",
  "dunhuang",
  "baroque",
  "low-poly",
  "swiss-style",
];

export async function getFeaturedConcepts(): Promise<Concept[]> {
  const all = await getAllConceptsOrdered();
  const order = new Map(FEATURED_SLUGS.map((s, i) => [s, i]));
  return all
    .filter((c) => order.has(c.slug))
    .sort((a, b) => order.get(a.slug)! - order.get(b.slug)!);
}

async function getAllConceptsOrdered(): Promise<Concept[]> {
  return dbOr(async (pool) => {
    const { rows } = await pool.sql`
      SELECT c.slug, c.lineage_slug AS "lineageSlug", l.domain_slug AS "domainSlug",
             c.name_cn AS "nameCn", c.name_en AS "nameEn", c.aliases,
             c.type, c.era,
             c.medium_category AS "mediumCategory", c.medium, c.technique, c.color,
             c.light, c.composition, c.texture,
             c.features, c.key_points AS "keyPoints", c.prompt_template AS "promptTemplate",
             c.related_slugs AS "relatedSlugs", c.image
      FROM concepts c JOIN lineages l ON l.slug = c.lineage_slug
      ORDER BY c.sort_order`;
    return rows as Concept[];
  }, () => [...seed.concepts]);
}

/** 首页用：13 领域 + 每个领域的谱系数与风格数 */
export async function getAtlasOverview(): Promise<DomainOverview[]> {
  const withImage = (
    d: Omit<DomainOverview, "image">
  ): DomainOverview => ({
    ...d,
    image: DOMAIN_IMAGES[d.slug] ?? "",
  });
  return dbOr(async (pool) => {
    const { rows } = await pool.sql`
      SELECT d.slug, d.index_no AS "indexNo", d.name_cn AS "nameCn", d.name_en AS "nameEn",
             COUNT(DISTINCT l.slug)::int AS "lineageCount",
             COUNT(c.slug)::int AS "conceptCount"
      FROM domains d
      LEFT JOIN lineages l ON l.domain_slug = d.slug
      LEFT JOIN concepts c ON c.lineage_slug = l.slug
      GROUP BY d.slug, d.index_no, d.name_cn, d.name_en
      ORDER BY d.index_no`;
    return (rows as DomainOverview[]).map(withImage);
  }, () =>
    [...seed.domains].sort(byIndex).map((d) => {
      const lineages = seed.lineages.filter((l) => l.domainSlug === d.slug);
      return withImage({
        ...d,
        lineageCount: lineages.length,
        conceptCount: seed.concepts.filter((c) =>
          lineages.some((l) => l.slug === c.lineageSlug)
        ).length,
      });
    })
  );
}
