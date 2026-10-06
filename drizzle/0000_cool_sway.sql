CREATE TABLE `posts` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`store` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`product_ids` text DEFAULT '[]' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_posts_owner_created` ON `posts` (`owner_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `preferences` (
	`owner_id` text PRIMARY KEY NOT NULL,
	`style_notes` text DEFAULT '' NOT NULL,
	`favorite_notes` text DEFAULT '' NOT NULL,
	`avoided_notes` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`store` text NOT NULL,
	`brand` text NOT NULL,
	`name` text NOT NULL,
	`model_key` text NOT NULL,
	`color` text DEFAULT '' NOT NULL,
	`url` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`used_in_post_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_products_owner_created` ON `products` (`owner_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_products_owner_model` ON `products` (`owner_id`,`model_key`);--> statement-breakpoint
CREATE TABLE `trend_letters` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`title` text NOT NULL,
	`kicker` text DEFAULT 'TREND NOTE' NOT NULL,
	`summary` text NOT NULL,
	`body` text NOT NULL,
	`source_urls` text DEFAULT '[]' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_letters_owner_created` ON `trend_letters` (`owner_id`,`created_at`);