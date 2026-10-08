CREATE TABLE `taste_examples` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`store` text NOT NULL,
	`brand` text NOT NULL,
	`name` text NOT NULL,
	`model` text NOT NULL,
	`color` text DEFAULT '' NOT NULL,
	`url` text NOT NULL,
	`product_url` text NOT NULL,
	`image_url` text DEFAULT '' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`first_used_in_post_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_taste_examples_owner_created` ON `taste_examples` (`owner_id`,`created_at`);--> statement-breakpoint
ALTER TABLE `posts` ADD `taste_example_ids` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `posts` ADD `taste_basis` text DEFAULT '' NOT NULL;