import { Router } from "express";
import { db, antiraidConfigsTable, verificationConfigsTable, ticketConfigsTable, logsConfigsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router = Router();

router.post("/guilds/:guildId/ai/analyze", requireAuth, async (req, res) => {
  const guildId = req.params.guildId as string;
  const [antiraid] = await db.select().from(antiraidConfigsTable).where(eq(antiraidConfigsTable.guildId, guildId));
  const [verification] = await db.select().from(verificationConfigsTable).where(eq(verificationConfigsTable.guildId, guildId));
  const [tickets] = await db.select().from(ticketConfigsTable).where(eq(ticketConfigsTable.guildId, guildId));
  const [logs] = await db.select().from(logsConfigsTable).where(eq(logsConfigsTable.guildId, guildId));

  const recommendations = [];
  let score = 100;

  if (!antiraid?.enabled) {
    recommendations.push({ category: "AntiRaid", severity: "high", title: "AntiRaid is disabled", description: "Enable AntiRaid to protect your server from mass attacks." });
    score -= 20;
  }
  if (!antiraid?.antiNuke) {
    recommendations.push({ category: "AntiRaid", severity: "medium", title: "AntiNuke not configured", description: "AntiNuke can prevent catastrophic server damage from rogue admins." });
    score -= 10;
  }
  if (!verification?.enabled) {
    recommendations.push({ category: "Verification", severity: "medium", title: "Verification disabled", description: "Enable member verification to filter out bots and alt accounts." });
    score -= 10;
  }
  if (!verification?.antiVpn) {
    recommendations.push({ category: "Security", severity: "low", title: "AntiVPN not enabled", description: "Enable AntiVPN to block users connecting via proxy or VPN." });
    score -= 5;
  }
  if (!tickets?.enabled) {
    recommendations.push({ category: "Support", severity: "low", title: "Ticket system disabled", description: "Set up the ticket system to handle member support requests efficiently." });
    score -= 5;
  }
  if (!logs?.enabled) {
    recommendations.push({ category: "Logs", severity: "medium", title: "Logging disabled", description: "Enable logs to keep track of all server activity and moderation actions." });
    score -= 10;
  }
  if (recommendations.length === 0) {
    recommendations.push({ category: "General", severity: "info", title: "Server is well configured", description: "Your server security configuration looks good! Keep monitoring for changes." });
  }

  res.json({ guildId, score: Math.max(0, score), recommendations, summary: `Security score: ${Math.max(0, score)}/100. Found ${recommendations.length} recommendation(s).`, analyzedAt: new Date().toISOString() });
});

router.post("/guilds/:guildId/ai/chat", requireAuth, async (req, res) => {
  const { message } = req.body;
  const responses: Record<string, string> = {
    antiraid: "To protect your server from raids, enable the AntiRaid module and configure AntiAlt to require accounts older than 7 days. Also enable AntiBot to block automated accounts.",
    verification: "Set up the verification system by configuring a role to assign after verification, enabling AntiVPN, and setting a minimum account age.",
    tickets: "Create a ticket panel by setting the category, support role, and transcript channel. Users will be able to open tickets directly in Discord.",
    premium: "Neuralix Premium offers advanced AI, unlimited backups, and AntiNuke protection. Check the Premium section for plan options.",
    default: "I'm the Neuralix AI Assistant. I can help you configure your server's security, tickets, verification, and more. Ask me about any specific feature!",
  };

  const lower = message.toLowerCase();
  let response = responses.default;
  if (lower.includes("raid") || lower.includes("attack")) response = responses.antiraid;
  else if (lower.includes("verif")) response = responses.verification;
  else if (lower.includes("ticket")) response = responses.tickets;
  else if (lower.includes("premium")) response = responses.premium;

  const suggestions = ["How do I enable AntiRaid?", "Set up verification", "Configure ticket system", "Analyze my server security"];

  res.json({ response, suggestions });
});

export default router;
