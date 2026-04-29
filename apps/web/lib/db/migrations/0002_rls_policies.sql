ALTER TABLE "public"."negotiations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."emails" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."market_research_cache" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."workflow_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY IF EXISTS "negotiations_user_policy" ON "public"."negotiations";--> statement-breakpoint
CREATE POLICY "negotiations_user_policy" ON "public"."negotiations"
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()::text) = user_id);--> statement-breakpoint
DROP POLICY IF EXISTS "messages_user_policy" ON "public"."messages";--> statement-breakpoint
CREATE POLICY "messages_user_policy" ON "public"."messages"
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()::text) = user_id);--> statement-breakpoint
DROP POLICY IF EXISTS "emails_user_policy" ON "public"."emails";--> statement-breakpoint
CREATE POLICY "emails_user_policy" ON "public"."emails"
  FOR ALL
  TO authenticated
  USING (
    negotiation_id IN (
      SELECT id FROM "public"."negotiations"
      WHERE user_id = (SELECT auth.uid()::text)
    )
  );--> statement-breakpoint
DROP POLICY IF EXISTS "workflow_events_user_policy" ON "public"."workflow_events";--> statement-breakpoint
CREATE POLICY "workflow_events_user_policy" ON "public"."workflow_events"
  FOR ALL
  TO authenticated
  USING (
    negotiation_id IN (
      SELECT id FROM "public"."negotiations"
      WHERE user_id = (SELECT auth.uid()::text)
    )
  );
