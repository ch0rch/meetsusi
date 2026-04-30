import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Susi — enums
// ---------------------------------------------------------------------------

export const negotiationStatusEnum = pgEnum("negotiation_status", [
  "researching",
  "awaiting_approval",
  "negotiating",
  "waiting_reply",
  "won",
  "lost",
  "cancelled",
]);

export const negotiationCategoryEnum = pgEnum("negotiation_category", [
  "saas",
  "auto",
  "real_estate",
  "high_ticket",
  "other",
]);

export const emailDirectionEnum = pgEnum("email_direction", [
  "outbound",
  "inbound",
]);

export const emailStatusEnum = pgEnum("email_status", [
  "draft",
  "pending_approval",
  "approved",
  "sent",
  "received",
  "failed",
]);

// ---------------------------------------------------------------------------
// negotiations
// ---------------------------------------------------------------------------

export const negotiations = pgTable(
  "negotiations",
  {
    id: text("id").primaryKey(),
    // UUID from Supabase auth.users — no FK across schemas
    userId: text("user_id").notNull(),

    // Context
    title: text("title").notNull(),
    category: negotiationCategoryEnum("category").notNull().default("other"),
    currentPrice: numeric("current_price"),
    targetPrice: numeric("target_price"),
    currency: text("currency").notNull().default("USD"),
    context: text("context"),
    vendorName: text("vendor_name"),
    vendorEmail: text("vendor_email"),

    // Language for all outbound emails (e.g. "Spanish", "English", "Portuguese")
    language: text("language").notNull().default("English"),

    // Market research captured by Susi before drafting (Tavily findings + industry insight + sources).
    // Persisted so draft_first_email and draftCounterOfferStep can ground emails in real data
    // without depending on the chat model's working memory.
    marketResearch: jsonb("market_research").$type<{
      findings: string;
      industryInsight?: string;
      sources?: string[];
    } | null>(),

    // Status
    status: negotiationStatusEnum("status").notNull().default("researching"),
    finalPrice: numeric("final_price"),

    // Email infrastructure — negotiate-[shortId]@domain
    susiEmail: text("susi_email").notNull().unique(),

    // Workflow SDK
    workflowRunId: text("workflow_run_id"),
    workflowStatus: text("workflow_status"),

    // Safety limits
    maxRounds: integer("max_rounds").notNull().default(8),
    roundsCompleted: integer("rounds_completed").notNull().default(0),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    wonAt: timestamp("won_at"),
    lostAt: timestamp("lost_at"),
  },
  (t) => [
    index("negotiations_user_id_idx").on(t.userId),
    index("negotiations_status_idx").on(t.status),
    index("negotiations_workflow_run_idx").on(t.workflowRunId),
  ],
);

// ---------------------------------------------------------------------------
// emails
// ---------------------------------------------------------------------------

export const emails = pgTable(
  "emails",
  {
    id: text("id").primaryKey(),
    negotiationId: text("negotiation_id")
      .notNull()
      .references(() => negotiations.id, { onDelete: "cascade" }),

    direction: emailDirectionEnum("direction").notNull(),
    fromEmail: text("from_email").notNull(),
    toEmail: text("to_email").notNull(),
    subject: text("subject"),
    body: text("body").notNull(),

    status: emailStatusEnum("status").notNull().default("draft"),
    approvedByUserAt: timestamp("approved_by_user_at"),
    sentAt: timestamp("sent_at"),
    receivedAt: timestamp("received_at"),
    failedReason: text("failed_reason"),

    // RFC 5322 threading
    messageId: text("message_id").unique(),
    inReplyTo: text("in_reply_to"),
    emailReferences: text("email_references").array(),

    // Idempotency key for inbound dedup
    externalId: text("external_id").unique(),

    // Inbound classification
    isAutoReply: boolean("is_auto_reply").notNull().default(false),
    isBounce: boolean("is_bounce").notNull().default(false),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("emails_negotiation_id_idx").on(t.negotiationId),
    index("emails_status_idx").on(t.status),
  ],
);

// ---------------------------------------------------------------------------
// messages (chat conversation per negotiation)
// ---------------------------------------------------------------------------

export const messageRoleEnum = pgEnum("message_role", ["user", "assistant"]);

export const messages = pgTable(
  "messages",
  {
    id: text("id").primaryKey(),
    negotiationId: text("negotiation_id").references(() => negotiations.id, {
      onDelete: "cascade",
    }),
    // UUID from Supabase auth.users — no FK across schemas
    userId: text("user_id").notNull(),

    role: messageRoleEnum("role").notNull(),
    content: text("content").notNull(),
    parts: jsonb("parts"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("messages_negotiation_id_idx").on(t.negotiationId),
    index("messages_user_id_idx").on(t.userId),
  ],
);

// ---------------------------------------------------------------------------
// market_research_cache
// ---------------------------------------------------------------------------

export const marketResearchCache = pgTable(
  "market_research_cache",
  {
    id: text("id").primaryKey(),
    cacheKey: text("cache_key").notNull().unique(),
    result: jsonb("result").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
  },
  (t) => [index("market_research_cache_expires_idx").on(t.expiresAt)],
);

// ---------------------------------------------------------------------------
// workflow_events (audit log)
// ---------------------------------------------------------------------------

export const workflowEvents = pgTable(
  "workflow_events",
  {
    id: text("id").primaryKey(),
    negotiationId: text("negotiation_id").references(() => negotiations.id, {
      onDelete: "cascade",
    }),
    workflowRunId: text("workflow_run_id"),
    eventType: text("event_type").notNull(),
    stepName: text("step_name"),
    payload: jsonb("payload"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("workflow_events_negotiation_id_idx").on(t.negotiationId),
    index("workflow_events_created_at_idx").on(t.createdAt),
  ],
);

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type Negotiation = typeof negotiations.$inferSelect;
export type NewNegotiation = typeof negotiations.$inferInsert;
export type Email = typeof emails.$inferSelect;
export type NewEmail = typeof emails.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type WorkflowEvent = typeof workflowEvents.$inferSelect;
export type NewWorkflowEvent = typeof workflowEvents.$inferInsert;
