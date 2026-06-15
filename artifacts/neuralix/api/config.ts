import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Client } from "pg";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");

  const databaseUrl = process.env.DATABASE_URL;
  const fallbackApiUrl = process.env.VITE_API_URL ?? "";

  if (!databaseUrl) {
    res.json({ apiUrl: fallbackApiUrl, source: "env-fallback" });
    return;
  }

  const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    const result = await client.query<{ key: string; value: string }>(
      "SELECT key, value FROM app_configs WHERE key IN ('api_url', 'app_url', 'frontend_url') LIMIT 10"
    );
    const config: Record<string, string> = {};
    for (const row of result.rows) config[row.key] = row.value;

    const apiUrl =
      config["api_url"] ||
      fallbackApiUrl ||
      "";
    const frontendUrl =
      config["frontend_url"] ||
      config["app_url"] ||
      "";

    res.json({ apiUrl, frontendUrl, source: "db" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(503).json({ apiUrl: fallbackApiUrl, source: "env-fallback", error: message });
  } finally {
    await client.end().catch(() => {});
  }
}
