CREATE TABLE `used_models` (
	`owner_id` text NOT NULL,
	`model_key` text NOT NULL,
	`post_id` text NOT NULL,
	PRIMARY KEY(`owner_id`, `model_key`)
);
