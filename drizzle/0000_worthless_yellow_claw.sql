CREATE TABLE "agents" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"name" text NOT NULL,
	"avatar" text DEFAULT '🤖' NOT NULL,
	"class_id" text NOT NULL,
	"duration" integer DEFAULT 1 NOT NULL,
	"deployed_lat" double precision NOT NULL,
	"deployed_lng" double precision NOT NULL,
	"generated_points" jsonb,
	"random_points" jsonb,
	"paths" jsonb,
	"current_points" integer DEFAULT 100,
	"status" text DEFAULT 'scavenging' NOT NULL,
	"battery_level" double precision DEFAULT 100 NOT NULL,
	"deployed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "balances" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"balance" integer DEFAULT 1000 NOT NULL,
	"date_created" timestamp DEFAULT now(),
	"date_updated" timestamp DEFAULT now(),
	CONSTRAINT "balances_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "daily_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"name" text NOT NULL,
	"desc" text NOT NULL,
	"icon" text NOT NULL,
	"reward" integer DEFAULT 0 NOT NULL,
	"last_completed" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_map_values" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"radious" integer DEFAULT 1000 NOT NULL,
	"nodes" integer DEFAULT 5 NOT NULL,
	"maxagents" integer DEFAULT 5 NOT NULL,
	"locked_lat" double precision,
	"locked_lng" double precision,
	"date_created" timestamp DEFAULT now(),
	"date_updated" timestamp DEFAULT now(),
	CONSTRAINT "user_map_values_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"user_id" bigint PRIMARY KEY NOT NULL,
	"first_name" text,
	"last_name" text,
	"username" text,
	"language_code" text,
	"is_premium" boolean,
	"photo_url" text,
	"invited_by" bigint
);
--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "balances" ADD CONSTRAINT "balances_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "daily_tasks" ADD CONSTRAINT "daily_tasks_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_map_values" ADD CONSTRAINT "user_map_values_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE cascade;