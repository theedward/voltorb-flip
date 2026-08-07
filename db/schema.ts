import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const gameStats = sqliteTable("game_stats", {
  id: integer("id").primaryKey(),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
