import { Router } from "express";
import { db, usersTable, guildConfigsTable, ticketsTable, licensesTable, blacklistTable, backupsTable } from "@workspace/db";
import { count } from "drizzle-orm";
import { requireOwner } from "../lib/auth";

const router = Router();

router.get("/admin/stats", requireOwner, async (req, res) => {
  const [guilds] = await db.select({ count: count() }).from(guildConfigsTable);
  const [users] = await db.select({ count: count() }).from(usersTable);
  const [tickets] = await db.select({ count: count() }).from(ticketsTable);
  const [blacklistCount] = await db.select({ count: count() }).from(blacklistTable);
  const [backupsCount] = await db.select({ count: count() }).from(backupsTable);

  res.json({
    totalGuilds: guilds?.count || 0,
    totalUsers: users?.count || 0,
    totalTickets: tickets?.count || 0,
    premiumGuilds: 0,
    activeBlacklist: blacklistCount?.count || 0,
    totalBackups: backupsCount?.count || 0,
  });
});

export default router;
