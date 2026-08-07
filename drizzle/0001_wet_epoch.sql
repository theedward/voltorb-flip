ALTER TABLE `game_stats` ADD `coin_balance` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `game_stats` ADD `target_name` text DEFAULT 'Dratini' NOT NULL;--> statement-breakpoint
ALTER TABLE `game_stats` ADD `target_cost` integer DEFAULT 2100 NOT NULL;