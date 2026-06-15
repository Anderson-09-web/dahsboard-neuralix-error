import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const urlHistoryTable = pgTable("url_history", {
  id: serial("id").primaryKey(),
  key: text("key").notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value").notNull(),
  changedAt: timestamp("changed_at", { withTimezone: true }).notNull().defaultNow(),
  source: text("source").default("admin"),
});

export type UrlHistory = typeof urlHistoryTable.$inferSelect;
