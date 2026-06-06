import { pgTable, text, boolean, integer, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ticketConfigsTable = pgTable("ticket_configs", {
  id: serial("id").primaryKey(),
  guildId: text("guild_id").notNull().unique(),
  enabled: boolean("enabled").notNull().default(false),
  categoryId: text("category_id"),
  supportRoleId: text("support_role_id"),
  transcriptChannelId: text("transcript_channel_id"),
  maxTicketsPerUser: integer("max_tickets_per_user").notNull().default(1),
  panelMessage: text("panel_message"),
  panelChannelId: text("panel_channel_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const ticketsTable = pgTable("tickets", {
  id: serial("id").primaryKey(),
  guildId: text("guild_id").notNull(),
  channelId: text("channel_id").notNull(),
  userId: text("user_id").notNull(),
  username: text("username").notNull(),
  subject: text("subject").notNull(),
  status: text("status").notNull().default("open"),
  claimedBy: text("claimed_by"),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertTicketConfigSchema = createInsertSchema(ticketConfigsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTicketConfig = z.infer<typeof insertTicketConfigSchema>;
export type TicketConfig = typeof ticketConfigsTable.$inferSelect;

export const insertTicketSchema = createInsertSchema(ticketsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Ticket = typeof ticketsTable.$inferSelect;
