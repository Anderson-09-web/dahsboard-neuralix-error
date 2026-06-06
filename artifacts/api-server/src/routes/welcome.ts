import { Router } from "express";
import { db, welcomeConfigsTable, goodbyeConfigsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/guilds/:guildId/welcome", requireAuth, async (req, res) => {
  const { guildId } = req.params;
  let [cfg] = await db.select().from(welcomeConfigsTable).where(eq(welcomeConfigsTable.guildId, guildId));
  if (!cfg) {
    const [created] = await db.insert(welcomeConfigsTable).values({ guildId }).returning();
    cfg = created;
  }
  res.json({ ...cfg, autoRoleIds: cfg.autoRoleIds || [] });
});

router.put("/guilds/:guildId/welcome", requireAuth, async (req, res) => {
  const { guildId } = req.params;
  const existing = await db.select().from(welcomeConfigsTable).where(eq(welcomeConfigsTable.guildId, guildId));
  let cfg;
  if (existing.length > 0) {
    const [updated] = await db.update(welcomeConfigsTable).set(req.body).where(eq(welcomeConfigsTable.guildId, guildId)).returning();
    cfg = updated;
  } else {
    const [created] = await db.insert(welcomeConfigsTable).values({ guildId, ...req.body }).returning();
    cfg = created;
  }
  res.json({ ...cfg, autoRoleIds: cfg.autoRoleIds || [] });
});

router.post("/guilds/:guildId/welcome/test", requireAuth, async (req, res) => {
  res.json({ ok: true, message: "Test welcome message sent" });
});

router.get("/guilds/:guildId/goodbye", requireAuth, async (req, res) => {
  const { guildId } = req.params;
  let [cfg] = await db.select().from(goodbyeConfigsTable).where(eq(goodbyeConfigsTable.guildId, guildId));
  if (!cfg) {
    const [created] = await db.insert(goodbyeConfigsTable).values({ guildId }).returning();
    cfg = created;
  }
  res.json(cfg);
});

router.put("/guilds/:guildId/goodbye", requireAuth, async (req, res) => {
  const { guildId } = req.params;
  const existing = await db.select().from(goodbyeConfigsTable).where(eq(goodbyeConfigsTable.guildId, guildId));
  let cfg;
  if (existing.length > 0) {
    const [updated] = await db.update(goodbyeConfigsTable).set(req.body).where(eq(goodbyeConfigsTable.guildId, guildId)).returning();
    cfg = updated;
  } else {
    const [created] = await db.insert(goodbyeConfigsTable).values({ guildId, ...req.body }).returning();
    cfg = created;
  }
  res.json(cfg);
});

router.post("/guilds/:guildId/goodbye/test", requireAuth, async (req, res) => {
  res.json({ ok: true, message: "Test goodbye message sent" });
});

export default router;
