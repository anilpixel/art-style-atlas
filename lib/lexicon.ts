import seedBase from "@/data/lexicon.json";
import seedNew from "@/data/lexicon-new.json";
import seedNew2 from "@/data/lexicon-new2.json";
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
  /** 资料来源链接（Wikipedia 等） */
  source?: string;
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
const seedNew2Typed = seedNew2 as { concepts: Concept[] };

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

/* ============ 按用途找风格（Finder） ============ */

import finderData from "@/data/finder.json";
import searchKeywords from "@/data/search-keywords.json";

export interface FinderStyle {
  slug: string;
  note: string;
}

export interface FinderUseCase {
  key: string;
  nameCn: string;
  nameEn: string;
  tagline: string;
  styles: FinderStyle[];
}

/** 按用途找风格：10 个用途 × 6 个精选风格（data/finder.json 策展） */
export function getFinderUseCases(): FinderUseCase[] {
  return (finderData as { useCases: FinderUseCase[] }).useCases;
}

export function getFinderUseCase(key: string): FinderUseCase | null {
  return getFinderUseCases().find((u) => u.key === key) ?? null;
}

/** Finder 卡片配图：优先真实案例图（Wikimedia），没有则用词条 AI 图 */
export function getFinderCardImage(slug: string): { src: string; isAi: boolean } {
  const cs = getConceptCases(slug);
  const real = cs.find((c) => c.kind === "image" && c.img);
  if (real?.img) return { src: real.img, isAi: false };
  const concept = seed.concepts.find((c) => c.slug === slug);
  return { src: concept?.image ?? "", isAi: true };
}

/* ============ Viblab 互链（P3-3：游戏风格词条 ↔ Viblab 实战页/指南） ============ */

import viblabLinksData from "@/data/viblab-links.json";

export interface ViblabGuideLink {
  slug: string;
  label: string;
  note: string;
}

export interface ViblabLink {
  styleSlug: string;
  styleName: string;
  guides: ViblabGuideLink[];
}

/** 只有 6 个与 Viblab 风格页 1:1 精确对应的词条有互链，不硬凑 */
export function getViblabLink(slug: string): ViblabLink | null {
  const m = viblabLinksData as Record<string, ViblabLink>;
  return m[slug] ?? null;
}

/* ============ 推荐教程（P4-2：付费简报包的教程链接） ============ */

import tutorialsData from "@/data/tutorials.json";

export interface TutorialLink {
  title: string;
  url: string;
  publisher: string;
}

/** 站外教程链接：只收录验链通过的权威链接，无数据的风格返回 []（调用方隐藏区块，不硬凑） */
export function getTutorials(slug: string): TutorialLink[] {
  const m = tutorialsData as unknown as Record<string, TutorialLink[]>;
  return m[slug] ?? [];
}

/* ============ 策展合集（P2-4：可分享的编辑精选清单） ============ */

import collectionsData from "@/data/collections.json";

export interface CollectionStyle {
  slug: string;
  note: string;
}

export interface ArtCollection {
  slug: string;
  nameCn: string;
  nameEn: string;
  tagline: string;
  audience: string;
  intro: string[];
  styles: CollectionStyle[];
}

/** 策展合集：data/collections.json，纯构建时数据（不进 DB，不需 seed） */
export function getCollections(): ArtCollection[] {
  return (collectionsData as { collections: ArtCollection[] }).collections;
}

export function getCollection(slug: string): ArtCollection | null {
  return getCollections().find((c) => c.slug === slug) ?? null;
}

/** 合集封面：取首个风格的卡片图（真实案例优先） */
export function getCollectionCoverImage(slug: string): {
  src: string;
  isAi: boolean;
} {
  const c = getCollection(slug);
  const first = c?.styles[0]?.slug ?? "";
  return first ? getFinderCardImage(first) : { src: "", isAi: true };
}

/** 用途 key → 对应策展合集（finder 页延伸阅读用） */
export const USECASE_COLLECTION: Record<string, string> = {
  horror: "horror-game-styles",
  "pixel-retro": "pixel-retro-styles",
  "cozy-cute": "cozy-game-styles",
  scifi: "future-punk-styles",
  "east-asian": "chinese-aesthetic-styles",
};

/** 内置数据：lexicon.json（30）+ lexicon-new.json（40）+ lexicon-new2.json（41）合并 */
const seed: SeedShape = {
  domains: seedBaseTyped.domains,
  lineages: seedBaseTyped.lineages,
  concepts: [...seedBaseTyped.concepts, ...seedNewTyped.concepts, ...seedNew2Typed.concepts],
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
               c.related_slugs AS "relatedSlugs", c.image, c.source
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
             c.related_slugs AS "relatedSlugs", c.image, c.source,
             l.name_cn AS "lineageNameCn", l.name_en AS "lineageNameEn",
             d.name_cn AS "domainNameCn", d.name_en AS "domainNameEn"
      FROM concepts c
      JOIN lineages l ON l.slug = c.lineage_slug
      JOIN domains d ON d.slug = l.domain_slug
      WHERE c.slug = ${slug}`;
    return (rows[0] as ConceptFull) ?? null;
  }, () => conceptFullFromSeed(slug));
}

/** 搜索命中：附带命中方式与用途词策展理由 */
export interface SearchHit extends Concept {
  /** 命中方式：名称 / 别名 / 用途词 / 特征描述 */
  matchKind: "name" | "alias" | "usage" | "feature";
  /** 用途词命中时的策展理由（一句为什么适合） */
  matchNote?: string;
  /** 用途词命中时的用途中文名 / key（链向 /finder） */
  matchedUse?: string;
  matchedUseKey?: string;
}

interface UsageKeywordMap {
  comment?: string;
  mappings: { keywords: string[]; useCase: string }[];
}

const usageMappings = (searchKeywords as UsageKeywordMap).mappings;

/**
 * 用途词匹配：查询词包含（或被包含于）任一关键词即命中该 useCase。
 * 如"恐怖游戏"→ horror，"复古"→ pixel-retro。短于 2 字不匹配，避免单字误伤。
 */
function matchUsageUseCases(q: string): FinderUseCase[] {
  const keyword = q.trim().toLowerCase();
  if (keyword.length < 2) return [];
  const matched = new Set<string>();
  for (const m of usageMappings) {
    for (const kw of m.keywords) {
      const k = kw.toLowerCase();
      if (keyword.includes(k) || (k.length >= 2 && k.includes(keyword))) {
        matched.add(m.useCase);
        break;
      }
    }
  }
  return [...matched]
    .map((key) => getFinderUseCase(key))
    .filter((u): u is FinderUseCase => !!u);
}

export async function searchConcepts(q: string): Promise<SearchHit[]> {
  const query = q.trim();
  const keyword = query.toLowerCase();
  if (!query) return [];

  // 用途词 → 命中的 useCase（及其精选风格 + 策展 note）
  const useCases = matchUsageUseCases(query);
  const usageSlugs = new Map<string, { note: string; useCn: string; useKey: string }>();
  for (const uc of useCases) {
    for (const s of uc.styles) {
      if (!usageSlugs.has(s.slug))
        usageSlugs.set(s.slug, { note: s.note, useCn: uc.nameCn, useKey: uc.key });
    }
  }

  const like = `%${query}%`;
  const nameHits = await dbOr(
    async (pool) => {
      const { rows } = await pool.sql`
      SELECT c.slug, c.lineage_slug AS "lineageSlug", l.domain_slug AS "domainSlug",
             c.name_cn AS "nameCn", c.name_en AS "nameEn", c.type, c.era,
             c.medium_category AS "mediumCategory", c.medium, c.technique, c.color,
             c.light, c.composition, c.texture, c.aliases,
             c.features, c.key_points AS "keyPoints", c.prompt_template AS "promptTemplate",
             c.related_slugs AS "relatedSlugs", c.image, c.source
      FROM concepts c JOIN lineages l ON l.slug = c.lineage_slug
      WHERE c.name_cn ILIKE ${like} OR c.name_en ILIKE ${like}
         OR c.aliases ILIKE ${like} OR c.features ILIKE ${like}
      ORDER BY c.sort_order LIMIT 60`;
      return rows as Concept[];
    },
    () =>
      seed.concepts.filter(
        (c) =>
          c.nameCn.includes(query) ||
          c.nameEn.toLowerCase().includes(keyword) ||
          (c.aliases ?? "").includes(query) ||
          c.features.includes(query)
      )
  );

  const kindOf = (c: Concept): SearchHit["matchKind"] => {
    if (c.nameCn.includes(query) || c.nameEn.toLowerCase().includes(keyword))
      return "name";
    if ((c.aliases ?? "").includes(query)) return "alias";
    if (usageSlugs.has(c.slug)) return "usage";
    return "feature";
  };
  const rank = { name: 0, alias: 1, usage: 2, feature: 3 } as const;

  const seen = new Set<string>();
  const hits: SearchHit[] = [];
  for (const c of nameHits) {
    if (seen.has(c.slug)) continue;
    seen.add(c.slug);
    const u = usageSlugs.get(c.slug);
    hits.push({
      ...c,
      matchKind: kindOf(c),
      ...(u ? { matchNote: u.note, matchedUse: u.useCn, matchedUseKey: u.useKey } : {}),
    });
  }
  // 用途词命中但名称/特征未命中的，按策展顺序补上
  const conceptBySlug = new Map(seed.concepts.map((c) => [c.slug, c]));
  for (const [slug, u] of usageSlugs) {
    if (seen.has(slug)) continue;
    seen.add(slug);
    const c = conceptBySlug.get(slug);
    if (c)
      hits.push({
        ...c,
        matchKind: "usage",
        matchNote: u.note,
        matchedUse: u.useCn,
        matchedUseKey: u.useKey,
      });
  }

  hits.sort((a, b) => rank[a.matchKind] - rank[b.matchKind]);
  return hits.slice(0, 30);
}

export async function getRandomConcept(): Promise<ConceptFull | null> {
  return dbOr(async (pool) => {
    const { rows } = await pool.sql`
      SELECT c.slug, c.lineage_slug AS "lineageSlug", l.domain_slug AS "domainSlug",
             c.name_cn AS "nameCn", c.name_en AS "nameEn", c.type, c.era,
             c.medium_category AS "mediumCategory", c.medium, c.technique, c.color,
             c.light, c.composition, c.texture, c.aliases,
             c.features, c.key_points AS "keyPoints", c.prompt_template AS "promptTemplate",
             c.related_slugs AS "relatedSlugs", c.image, c.source,
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
             c.related_slugs AS "relatedSlugs", c.image, c.source
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
