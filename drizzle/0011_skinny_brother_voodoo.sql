ALTER TABLE "accounts" ADD COLUMN "username" varchar(256);--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "password_hash" varchar;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_username_unique" UNIQUE("username");