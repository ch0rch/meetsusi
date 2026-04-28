CREATE TYPE "public"."email_direction" AS ENUM('outbound', 'inbound');--> statement-breakpoint
CREATE TYPE "public"."email_status" AS ENUM('draft', 'pending_approval', 'approved', 'sent', 'received', 'failed');--> statement-breakpoint
CREATE TYPE "public"."message_role" AS ENUM('user', 'assistant');--> statement-breakpoint
CREATE TYPE "public"."negotiation_category" AS ENUM('saas', 'auto', 'real_estate', 'high_ticket', 'other');--> statement-breakpoint
CREATE TYPE "public"."negotiation_status" AS ENUM('researching', 'awaiting_approval', 'negotiating', 'waiting_reply', 'won', 'lost', 'cancelled');--> statement-breakpoint
CREATE TABLE "emails" (
	"id" text PRIMARY KEY NOT NULL,
	"negotiation_id" text NOT NULL,
	"direction" "email_direction" NOT NULL,
	"from_email" text NOT NULL,
	"to_email" text NOT NULL,
	"subject" text,
	"body" text NOT NULL,
	"status" "email_status" DEFAULT 'draft' NOT NULL,
	"approved_by_user_at" timestamp,
	"sent_at" timestamp,
	"received_at" timestamp,
	"failed_reason" text,
	"message_id" text,
	"in_reply_to" text,
	"email_references" text[],
	"external_id" text,
	"is_auto_reply" boolean DEFAULT false NOT NULL,
	"is_bounce" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "emails_message_id_unique" UNIQUE("message_id"),
	CONSTRAINT "emails_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "market_research_cache" (
	"id" text PRIMARY KEY NOT NULL,
	"cache_key" text NOT NULL,
	"result" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	CONSTRAINT "market_research_cache_cache_key_unique" UNIQUE("cache_key")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" text PRIMARY KEY NOT NULL,
	"negotiation_id" text,
	"user_id" text NOT NULL,
	"role" "message_role" NOT NULL,
	"content" text NOT NULL,
	"parts" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "negotiations" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"category" "negotiation_category" DEFAULT 'other' NOT NULL,
	"current_price" numeric,
	"target_price" numeric,
	"currency" text DEFAULT 'USD' NOT NULL,
	"context" text,
	"vendor_name" text,
	"vendor_email" text,
	"status" "negotiation_status" DEFAULT 'researching' NOT NULL,
	"final_price" numeric,
	"susi_email" text NOT NULL,
	"workflow_run_id" text,
	"workflow_status" text,
	"max_rounds" integer DEFAULT 8 NOT NULL,
	"rounds_completed" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"won_at" timestamp,
	"lost_at" timestamp,
	CONSTRAINT "negotiations_susi_email_unique" UNIQUE("susi_email")
);
--> statement-breakpoint
CREATE TABLE "workflow_events" (
	"id" text PRIMARY KEY NOT NULL,
	"negotiation_id" text,
	"workflow_run_id" text,
	"event_type" text NOT NULL,
	"step_name" text,
	"payload" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "emails" ADD CONSTRAINT "emails_negotiation_id_negotiations_id_fk" FOREIGN KEY ("negotiation_id") REFERENCES "public"."negotiations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_negotiation_id_negotiations_id_fk" FOREIGN KEY ("negotiation_id") REFERENCES "public"."negotiations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_events" ADD CONSTRAINT "workflow_events_negotiation_id_negotiations_id_fk" FOREIGN KEY ("negotiation_id") REFERENCES "public"."negotiations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "emails_negotiation_id_idx" ON "emails" USING btree ("negotiation_id");--> statement-breakpoint
CREATE INDEX "emails_status_idx" ON "emails" USING btree ("status");--> statement-breakpoint
CREATE INDEX "market_research_cache_expires_idx" ON "market_research_cache" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "messages_negotiation_id_idx" ON "messages" USING btree ("negotiation_id");--> statement-breakpoint
CREATE INDEX "messages_user_id_idx" ON "messages" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "negotiations_user_id_idx" ON "negotiations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "negotiations_status_idx" ON "negotiations" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "negotiations_susi_email_idx" ON "negotiations" USING btree ("susi_email");--> statement-breakpoint
CREATE INDEX "negotiations_workflow_run_idx" ON "negotiations" USING btree ("workflow_run_id");--> statement-breakpoint
CREATE INDEX "workflow_events_negotiation_id_idx" ON "workflow_events" USING btree ("negotiation_id");--> statement-breakpoint
CREATE INDEX "workflow_events_created_at_idx" ON "workflow_events" USING btree ("created_at");