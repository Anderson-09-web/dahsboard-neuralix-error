import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const appConfigsTable = pgTable("app_configs", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type AppConfig = typeof appConfigsTable.$inferSelect;
