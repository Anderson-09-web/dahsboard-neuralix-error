/**
 * App Config Loader
 *
 * Loads configuration from the `app_configs` DB table first,
 * then falls back to environment variables.
 *
 * URL cascade: when `api_url` or `frontend_url` are set via setConfig,
 * dependent keys (discord_redirect_uri, etc.) are auto-derived unless
 * an explicit override exists. Changes are recorded in `url_history`.
 */

import { db, appConfigsTable } from "@workspace/db";
import { urlHistoryTable } from "@workspace/db";
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
 * Set a config value in the DB, refresh cache, record history,
 * and cascade-update dependent keys.
 */
export async function setConfig(key: string, value: string, description?: string, source = "admin"): Promise<void> {
  const oldValue = cache.get(key);

  await db
    .insert(appConfigsTable)
    .values({ key, value, description })
    .onConflictDoUpdate({
      target: appConfigsTable.key,
      set: { value, description, updatedAt: new Date() },
    });
  cache.set(key, value);

  // Record history if value actually changed
  if (oldValue !== value) {
    try {
      await db.insert(urlHistoryTable).values({ key, oldValue, newValue: value, source });
    } catch (err) {
      logger.warn({ err }, "Could not write url_history");
    }
  }

  // Cascade: when api_url changes, auto-derive discord_redirect_uri
  // (only if no explicit discord_redirect_uri override exists)
  if (key === "api_url") {
    const hasExplicitRedirect = await db.select().from(appConfigsTable)
      .then(rows => rows.find(r => r.key === "discord_redirect_uri" && r.description?.includes("manual-override")));
    if (!hasExplicitRedirect) {
      const base = value.replace(/\/+$/, "");
      const newRedirectUri = `${base}/api/auth/discord/callback`;
      await db
        .insert(appConfigsTable)
        .values({ key: "discord_redirect_uri", value: newRedirectUri, description: "auto-derived from api_url" })
        .onConflictDoUpdate({
          target: appConfigsTable.key,
          set: { value: newRedirectUri, description: "auto-derived from api_url", updatedAt: new Date() },
        });
      cache.set("discord_redirect_uri", newRedirectUri);
      logger.info({ newRedirectUri }, "Auto-updated discord_redirect_uri from api_url change");
    }
  }
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
