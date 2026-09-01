ALTER TABLE "orders" ADD COLUMN "delivery_time_window_start" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_time_window_end" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "capacity_in_items" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "preferred_time_window_start" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "preferred_time_window_end" text;