import { pgTable, text, boolean, integer, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const antiraidConfigsTable = pgTable("antiraid_configs", {
  id: serial("id").primaryKey(),
  guildId: text("guild_id").notNull().unique(),
  enabled: boolean("enabled").notNull().default(false),
  antiAlt: boolean("anti_alt").notNull().default(false),
  antiAltMinAge: integer("anti_alt_min_age").notNull().default(7),
  antiBot: boolean("anti_bot").notNull().default(false),
  antiBotWhitelist: text("anti_bot_whitelist").array().notNull().default([]),
  antiSpam: boolean("anti_spam").notNull().default(false),
  antiSpamLimit: integer("anti_spam_limit").notNull().default(5),
  antiLinks: boolean("anti_links").notNull().default(false),
  allowedDomains: text("allowed_domains").array().notNull().default([]),
  blockedDomains: text("blocked_domains").array().notNull().default([]),
  antiMassMention: boolean("anti_mass_mention").notNull().default(false),
  massMentionLimit: integer("mass_mention_limit").notNull().default(5),
  antiWebhook: boolean("anti_webhook").notNull().default(false),
  antiChannelCreate: boolean("anti_channel_create").notNull().default(false),
  antiChannelDelete: boolean("anti_channel_delete").notNull().default(false),
  antiChannelUpdate: boolean("anti_channel_update").notNull().default(false),
  antiRoleCreate: boolean("anti_role_create").notNull().default(false),
  antiRoleDelete: boolean("anti_role_delete").notNull().default(false),
  antiRoleUpdate: boolean("anti_role_update").notNull().default(false),
  antiEmojiCreate: boolean("anti_emoji_create").notNull().default(false),
  antiEmojiDelete: boolean("anti_emoji_delete").notNull().default(false),
  antiBanMass: boolean("anti_ban_mass").notNull().default(false),
  antiKickMass: boolean("anti_kick_mass").notNull().default(false),
  antiNuke: boolean("anti_nuke").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const antiraidStatsTable = pgTable("antiraid_stats", {
  id: serial("id").primaryKey(),
  guildId: text("guild_id").notNull().unique(),
  detectedToday: integer("detected_today").notNull().default(0),
  blockedAlt: integer("blocked_alt").notNull().default(0),
  blockedVpn: integer("blocked_vpn").notNull().default(0),
  blockedBot: integer("blocked_bot").notNull().default(0),
  blockedSpam: integer("blocked_spam").notNull().default(0),
  totalDetections: integer("total_detections").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAntiraidConfigSchema = createInsertSchema(antiraidConfigsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAntiraidConfig = z.infer<typeof insertAntiraidConfigSchema>;
export type AntiraidConfig = typeof antiraidConfigsTable.$inferSelect;
