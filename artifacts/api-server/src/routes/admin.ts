import { Router } from "express";
import { db, usersTable, guildConfigsTable, ticketsTable, licensesTable, blacklistTable, backupsTable, supportTicketsTable, secondaryAdminsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { requireOwner, requireAuth } from "../lib/auth";
import type { AdminPermission } from "@workspace/db";

const router = Router();

// ─── Stats ────────────────────────────────────────────────────────────────────
router.get("/admin/stats", requireOwner, async (req, res) => {
  const [guilds] = await db.select({ count: count() }).from(guildConfigsTable);
  const [users] = await db.select({ count: count() }).from(usersTable);
  const [tickets] = await db.select({ count: count() }).from(ticketsTable);
  const [premiumGuilds] = await db.select({ count: count() }).from(guildConfigsTable).where(eq(guildConfigsTable.premiumActive, true));
  const [blacklistCount] = await db.select({ count: count() }).from(blacklistTable);
  const [backupsCount] = await db.select({ count: count() }).from(backupsTable);
  const [adminsCount] = await db.select({ count: count() }).from(secondaryAdminsTable).where(eq(secondaryAdminsTable.active, true));
  const [openSupport] = await db.select({ count: count() }).from(supportTicketsTable).where(eq(supportTicketsTable.status, "open"));

  res.json({
    totalGuilds: guilds?.count || 0,
    totalUsers: users?.count || 0,
    totalTickets: tickets?.count || 0,
    premiumGuilds: premiumGuilds?.count || 0,
    activeBlacklist: blacklistCount?.count || 0,
    totalBackups: backupsCount?.count || 0,
    totalAdmins: adminsCount?.count || 0,
    openSupport: openSupport?.count || 0,
  });
});

// ─── Licenses ────────────────────────────────────────────────────────────────
router.get("/admin/licenses", requireOwner, async (_req, res) => {
  const licenses = await db.select().from(licensesTable).orderBy(licensesTable.createdAt);
  res.json(licenses);
});

router.post("/admin/licenses", requireOwner, async (req, res) => {
  const { plan, guildId, expiresAt } = req.body;
  const plans: Record<string, string> = { plus: "PLUS", pro: "PRO", ultra: "ULTRA" };
  const prefix = plans[plan] || "PLUS";
  const key = `NRX-${prefix}-${Array.from({ length: 16 }, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 36)]).join("")}`;
  const [license] = await db.insert(licensesTable).values({ key, plan, guildId: guildId || null, active: true, expiresAt: expiresAt ? new Date(expiresAt) : null }).returning();
  res.json(license);
});

router.delete("/admin/licenses/:id", requireOwner, async (req, res) => {
  await db.delete(licensesTable).where(eq(licensesTable.id, Number(req.params.id)));
  res.status(204).end();
});

// ─── Secondary Admins ─────────────────────────────────────────────────────────
router.get("/admin/admins", requireOwner, async (_req, res) => {
  const admins = await db.select().from(secondaryAdminsTable).orderBy(secondaryAdminsTable.createdAt);
  res.json(admins);
});

router.post("/admin/admins", requireOwner, async (req, res) => {
  const owner = (req as any).user;
  const { discordId, username, permissions } = req.body as { discordId: string; username: string; permissions: AdminPermission[] };
  if (!discordId || !username) { res.status(400).json({ error: "discordId y username son requeridos" }); return; }

  const existing = await db.select().from(secondaryAdminsTable).where(eq(secondaryAdminsTable.discordId, discordId));
  if (existing.length > 0) {
    const [updated] = await db.update(secondaryAdminsTable).set({ username, permissions: permissions || [], active: true, grantedBy: owner.discordId }).where(eq(secondaryAdminsTable.discordId, discordId)).returning();
    res.json(updated);
    return;
  }
  const [admin] = await db.insert(secondaryAdminsTable).values({ userId: `user_${discordId}`, discordId, username, permissions: permissions || [], active: true, grantedBy: owner.discordId }).returning();
  res.json(admin);
});

router.patch("/admin/admins/:id", requireOwner, async (req, res) => {
  const { permissions, active } = req.body;
  const [updated] = await db.update(secondaryAdminsTable)
    .set({ ...(permissions !== undefined && { permissions }), ...(active !== undefined && { active }) })
    .where(eq(secondaryAdminsTable.id, Number(req.params.id)))
    .returning();
  res.json(updated);
});

router.delete("/admin/admins/:id", requireOwner, async (req, res) => {
  await db.delete(secondaryAdminsTable).where(eq(secondaryAdminsTable.id, Number(req.params.id)));
  res.status(204).end();
});

export default router;
