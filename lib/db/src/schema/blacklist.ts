import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const blacklistTable = pgTable("blacklist", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  username: text("username").notNull(),
  reason: text("reason").notNull(),
  addedBy: text("added_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBlacklistSchema = createInsertSchema(blacklistTable).omit({ id: true, createdAt: true });
export type InsertBlacklist = z.infer<typeof insertBlacklistSchema>;
export type BlacklistEntry = typeof blacklistTable.$inferSelect;
