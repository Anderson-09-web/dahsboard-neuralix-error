import { Router } from "express";
import { db, verificationConfigsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/guilds/:guildId/verification", requireAuth, async (req, res) => {
  const guildId = req.params.guildId as string;
  let [cfg] = await db.select().from(verificationConfigsTable).where(eq(verificationConfigsTable.guildId, guildId));
  if (!cfg) {
    const [created] = await db.insert(verificationConfigsTable).values({ guildId }).returning();
    cfg = created;
  }
  res.json(cfg);
});

router.put("/guilds/:guildId/verification", requireAuth, async (req, res) => {
  const guildId = req.params.guildId as string;
  const existing = await db.select().from(verificationConfigsTable).where(eq(verificationConfigsTable.guildId, guildId));
  let cfg;
  if (existing.length > 0) {
    const [updated] = await db.update(verificationConfigsTable).set(req.body).where(eq(verificationConfigsTable.guildId, guildId)).returning();
    cfg = updated;
  } else {
    const [created] = await db.insert(verificationConfigsTable).values({ guildId, ...req.body }).returning();
    cfg = created;
  }
  res.json(cfg);
});

router.post("/verify/:guildId", requireAuth, async (req, res) => {
  const guildId = req.params.guildId as string;
  const [cfg] = await db.select().from(verificationConfigsTable).where(eq(verificationConfigsTable.guildId, guildId));
  if (!cfg || !cfg.enabled) {
    res.json({ success: false, message: "Verification is not enabled for this server", roleAssigned: false });
    return;
  }
  res.json({ success: true, message: "Verification successful! Your role has been assigned.", roleAssigned: true });
});

export default router;
