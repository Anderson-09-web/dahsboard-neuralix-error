/**
 * App Config Loader
 *
 * Loads configuration from the `app_configs` DB table first,
 * then falls back to environment variables.
 *
 * This means you only need DATABASE_URL + SESSION_SECRET in
 * Vercel / any host — everything else can be stored in the DB.
 */

import { db, appConfigsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

// In-memory cache so we don't hit DB on every request
const cache = new Map<string, string>();
let cacheLoaded = false;

async function loadAll(): Promise<void> {
  if (cacheLoaded) return;
  try {
    const rows = await db.select().from(appConfigsTable);
    for (const row of rows) {
      cache.set(row.key, row.value);
    }
    cacheLoaded = true;
  } catch (err) {
    logger.warn({ err }, "Could not load app_configs from DB — falling back to env vars only");
    cacheLoaded = true;
  }
}

/**
 * Get a config value. DB takes priority over env var.
 * Returns undefined if neither exists.
 */
export async function getConfig(key: string): Promise<string | undefined> {
  await loadAll();
  if (cache.has(key)) return cache.get(key);
  return process.env[key.toUpperCase()] ?? undefined;
}

/**
 * Set a config value in the DB and refresh cache.
 */
export async function setConfig(key: string, value: string, description?: string): Promise<void> {
  await db
    .insert(appConfigsTable)
    .values({ key, value, description })
    .onConflictDoUpdate({
      target: appConfigsTable.key,
      set: { value, description, updatedAt: new Date() },
    });
  cache.set(key, value);
}

/**
 * Invalidate cache (call after bulk DB writes).
 */
export function invalidateConfigCache(): void {
  cache.clear();
  cacheLoaded = false;
}

/**
 * Get multiple config values at once.
 */
export async function getConfigs(keys: string[]): Promise<Record<string, string | undefined>> {
  await loadAll();
  const result: Record<string, string | undefined> = {};
  for (const key of keys) {
    result[key] = cache.get(key) ?? process.env[key.toUpperCase()] ?? undefined;
  }
  return result;
}
