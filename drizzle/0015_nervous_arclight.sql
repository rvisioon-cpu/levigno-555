CREATE TABLE `canvas_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`width` integer NOT NULL,
	`height` integer NOT NULL,
	`aspect_ratio` text NOT NULL,
	`layout` text NOT NULL,
	`created_by` text,
	`created_at` integer,
	`deleted_at` integer,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
