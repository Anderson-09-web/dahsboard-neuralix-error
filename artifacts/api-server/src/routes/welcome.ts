import { Router } from "express";
import { db, welcomeConfigsTable, goodbyeConfigsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

// ─── Welcome ──────────────────────────────────────────────────────────────────

router.get("/guilds/:guildId/welcome", requireAuth, async (req, res) => {
  const guildId = req.params.guildId as string;
  let [cfg] = await db.select().from(welcomeConfigsTable).where(eq(welcomeConfigsTable.guildId, guildId));
  if (!cfg) {
    const [created] = await db.insert(welcomeConfigsTable).values({ guildId }).returning();
    cfg = created;
  }
  res.json({ ...cfg, autoRoleIds: cfg.autoRoleIds || [] });
});

router.put("/guilds/:guildId/welcome", requireAuth, async (req, res) => {
  const guildId = req.params.guildId as string;
  const body = req.body as Record<string, unknown>;
  const autoRoleIds: string[] = Array.isArray(body.autoRoleIds)
    ? (body.autoRoleIds as string[])
    : typeof body.autoRoleIds === "string" && body.autoRoleIds
      ? [body.autoRoleIds as string]
      : [];

  const existing = await db.select().from(welcomeConfigsTable).where(eq(welcomeConfigsTable.guildId, guildId));
  let cfg;
  if (existing.length > 0) {
    const [updated] = await db.update(welcomeConfigsTable)
      .set({ ...body, autoRoleIds } as any)
      .where(eq(welcomeConfigsTable.guildId, guildId))
      .returning();
    cfg = updated;
  } else {
    const [created] = await db.insert(welcomeConfigsTable)
      .values({ guildId, ...body, autoRoleIds } as any)
      .returning();
    cfg = created;
  }
  res.json({ ...cfg, autoRoleIds: cfg.autoRoleIds || [] });
});

router.post("/guilds/:guildId/welcome/test", requireAuth, async (_req, res) => {
  res.json({ ok: true, message: "Test welcome message sent" });
});

// ─── Goodbye ──────────────────────────────────────────────────────────────────

router.get("/guilds/:guildId/goodbye", requireAuth, async (req, res) => {
  const guildId = req.params.guildId as string;
  let [cfg] = await db.select().from(goodbyeConfigsTable).where(eq(goodbyeConfigsTable.guildId, guildId));
  if (!cfg) {
    const [created] = await db.insert(goodbyeConfigsTable).values({ guildId }).returning();
    cfg = created;
  }
  res.json(cfg);
});

router.put("/guilds/:guildId/goodbye", requireAuth, async (req, res) => {
  const guildId = req.params.guildId as string;
  const existing = await db.select().from(goodbyeConfigsTable).where(eq(goodbyeConfigsTable.guildId, guildId));
  let cfg;
  if (existing.length > 0) {
    const [updated] = await db.update(goodbyeConfigsTable)
      .set(req.body as any)
      .where(eq(goodbyeConfigsTable.guildId, guildId))
      .returning();
    cfg = updated;
  } else {
    const [created] = await db.insert(goodbyeConfigsTable)
      .values({ ...(req.body as object), guildId } as any)
      .returning();
    cfg = created;
  }
  res.json(cfg);
});

router.post("/guilds/:guildId/goodbye/test", requireAuth, async (_req, res) => {
  res.json({ ok: true, message: "Test goodbye message sent" });
});

export default router;
