import { createPool } from "@vercel/postgres";

/** 是否配置了 Vercel Postgres（Neon）连接串 */
export function isDbConfigured(): boolean {
  return Boolean(
    process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING
  );
}

let pool: ReturnType<typeof createPool> | null = null;

/** 懒加载连接池；未配置时返回 null，由调用方回退到本地 JSON 数据 */
export function getPool() {
  if (!isDbConfigured()) return null;
  if (!pool) {
    // createPool 需要 pooled 连接串（pgbouncer），直连串是给 createClient 用的
    pool = createPool({
      connectionString:
        process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING,
    });
  }
  return pool;
}
