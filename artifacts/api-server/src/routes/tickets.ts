import { Router } from "express";
import { db, ticketConfigsTable, ticketsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/guilds/:guildId/tickets/config", requireAuth, async (req, res) => {
  const { guildId } = req.params;
  let [cfg] = await db.select().from(ticketConfigsTable).where(eq(ticketConfigsTable.guildId, guildId));
  if (!cfg) {
    const [created] = await db.insert(ticketConfigsTable).values({ guildId }).returning();
    cfg = created;
  }
  res.json(cfg);
});

router.put("/guilds/:guildId/tickets/config", requireAuth, async (req, res) => {
  const { guildId } = req.params;
  const existing = await db.select().from(ticketConfigsTable).where(eq(ticketConfigsTable.guildId, guildId));
  let cfg;
  if (existing.length > 0) {
    const [updated] = await db.update(ticketConfigsTable).set(req.body).where(eq(ticketConfigsTable.guildId, guildId)).returning();
    cfg = updated;
  } else {
    const [created] = await db.insert(ticketConfigsTable).values({ guildId, ...req.body }).returning();
    cfg = created;
  }
  res.json(cfg);
});

router.get("/guilds/:guildId/tickets", requireAuth, async (req, res) => {
  const { guildId } = req.params;
  const tickets = await db.select().from(ticketsTable).where(eq(ticketsTable.guildId, guildId));
  res.json(tickets);
});

router.post("/guilds/:guildId/tickets/:ticketId/close", requireAuth, async (req, res) => {
  const ticketId = Number(req.params.ticketId);
  await db.update(ticketsTable).set({ status: "closed", closedAt: new Date() }).where(eq(ticketsTable.id, ticketId));
  res.json({ ok: true });
});

export default router;
