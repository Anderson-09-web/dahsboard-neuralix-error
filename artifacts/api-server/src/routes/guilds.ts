import { Router } from "express";
import axios from "axios";
import { db, guildConfigsTable, antiraidStatsTable, ticketsTable, verificationConfigsTable, logEntriesTable, backupsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

const DISCORD_API = "https://discord.com/api/v10";
const MANAGE_GUILD = 0x20;
const ADMINISTRATOR = 0x8;

function hasAdminPerms(permissions: string): boolean {
  const perms = BigInt(permissions);
  return (perms & BigInt(ADMINISTRATOR)) !== 0n || (perms & BigInt(MANAGE_GUILD)) !== 0n;
}

router.get("/guilds", requireAuth, async (req, res) => {
  const user = (req as any).user;
  try {
    const guildsRes = await axios.get(`${DISCORD_API}/users/@me/guilds`, {
      headers: { Authorization: `Bearer ${user.accessToken}` },
    });
    const adminGuilds = guildsRes.data.filter((g: any) => hasAdminPerms(g.permissions));

    const guildConfigs = await db.select().from(guildConfigsTable);
    const configMap = new Map(guildConfigs.map((c) => [c.guildId, c]));

    const result = adminGuilds.map((g: any) => {
      const cfg = configMap.get(g.id);
      return {
        id: g.id,
        name: g.name,
        icon: g.icon,
        memberCount: cfg?.memberCount || 0,
        botPresent: cfg?.botPresent || false,
        premiumTier: g.premium_tier || 0,
        permissions: g.permissions,
      };
    });

    res.json(result);
  } catch (err: any) {
    req.log.error({ err }, "Failed to fetch guilds");
    res.status(500).json({ error: "Failed to fetch guilds" });
  }
});

router.get("/guilds/:guildId", requireAuth, async (req, res) => {
  const { guildId } = req.params;
  const [cfg] = await db.select().from(guildConfigsTable).where(eq(guildConfigsTable.guildId, guildId));

  const [openTicketsResult] = await db
    .select({ count: count() })
    .from(ticketsTable)
    .where(eq(ticketsTable.guildId, guildId));

  const [verifiedResult] = await db
    .select({ count: count() })
    .from(verificationConfigsTable)
    .where(eq(verificationConfigsTable.guildId, guildId));

  res.json({
    id: guildId,
    name: cfg?.guildName || "Unknown Server",
    icon: cfg?.guildIcon || null,
    memberCount: cfg?.memberCount || 0,
    onlineMemberCount: Math.floor((cfg?.memberCount || 0) * 0.3),
    botPresent: cfg?.botPresent || false,
    premiumTier: 0,
    openTickets: openTicketsResult?.count || 0,
    verifiedMembers: verifiedResult?.count || 0,
    antiraidEnabled: false,
    premiumActive: cfg?.premiumActive || false,
  });
});

router.get("/guilds/:guildId/stats", requireAuth, async (req, res) => {
  const { guildId } = req.params;
  const [cfg] = await db.select().from(guildConfigsTable).where(eq(guildConfigsTable.guildId, guildId));
  const [stats] = await db.select().from(antiraidStatsTable).where(eq(antiraidStatsTable.guildId, guildId));
  const [openTickets] = await db.select({ count: count() }).from(ticketsTable).where(eq(ticketsTable.guildId, guildId));
  const [closedTickets] = await db.select({ count: count() }).from(ticketsTable).where(eq(ticketsTable.guildId, guildId));
  const [backupsCount] = await db.select({ count: count() }).from(backupsTable).where(eq(backupsTable.guildId, guildId));
  const [recentLogs] = await db.select({ count: count() }).from(logEntriesTable).where(eq(logEntriesTable.guildId, guildId));

  res.json({
    guildId,
    memberCount: cfg?.memberCount || 0,
    onlineCount: Math.floor((cfg?.memberCount || 0) * 0.3),
    openTickets: openTickets?.count || 0,
    closedTickets: closedTickets?.count || 0,
    verifiedMembers: 0,
    antiraidDetections: stats?.totalDetections || 0,
    recentLogs: recentLogs?.count || 0,
    backupsCount: backupsCount?.count || 0,
  });
});

router.get("/guilds/:guildId/bot-status", requireAuth, async (req, res) => {
  const { guildId } = req.params;
  const [cfg] = await db.select().from(guildConfigsTable).where(eq(guildConfigsTable.guildId, guildId));
  const clientId = process.env.DISCORD_CLIENT_ID!;
  const addBotUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands&guild_id=${guildId}`;
  res.json({ present: cfg?.botPresent || false, addBotUrl });
});

export default router;
