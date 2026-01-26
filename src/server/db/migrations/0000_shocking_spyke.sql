CREATE TABLE `assets` (
	`id` text PRIMARY KEY NOT NULL,
	`component_id` text,
	`name` text NOT NULL,
	`type` text,
	`source` text,
	`file_path` text,
	`prompt_used` text,
	`metadata` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP',
	FOREIGN KEY (`component_id`) REFERENCES `components`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `collection_components` (
	`collection_id` text NOT NULL,
	`component_id` text NOT NULL,
	`position` integer,
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`component_id`) REFERENCES `components`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `collections` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `components` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`prompt_used` text,
	`idea_json` text,
	`source_code` text,
	`tags` text,
	`duration_frames` integer DEFAULT 150,
	`fps` integer DEFAULT 30,
	`width` integer DEFAULT 1920,
	`height` integer DEFAULT 1080,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `pending_ideas` (
	`id` text PRIMARY KEY NOT NULL,
	`idea_json` text NOT NULL,
	`settings_json` text NOT NULL,
	`asset_ids` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP',
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP'
);
