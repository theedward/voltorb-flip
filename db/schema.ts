import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const gameStats = sqliteTable("game_stats", {
  id: integer("id").primaryKey(),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  coinBalance: integer("coin_balance").notNull().default(0),
  targetName: text("target_name").notNull().default("Dratini"),
  targetCost: integer("target_cost").notNull().default(2100),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
