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
// better-auth tables (do not remove)
// ---------------------------------------------------------------------------

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const authSessions = pgTable("auth_sessions", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Context
    title: text("title").notNull(),
    category: negotiationCategoryEnum("category").notNull().default("other"),
    currentPrice: numeric("current_price"),
    targetPrice: numeric("target_price"),
    currency: text("currency").notNull().default("USD"),
    context: text("context"),
    vendorName: text("vendor_name"),
    vendorEmail: text("vendor_email"),

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
    uniqueIndex("negotiations_susi_email_idx").on(t.susiEmail),
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
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    role: messageRoleEnum("role").notNull(),
    content: text("content").notNull(),
    // AI SDK message parts (tool calls, tool results, etc.)
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

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Negotiation = typeof negotiations.$inferSelect;
export type NewNegotiation = typeof negotiations.$inferInsert;
export type Email = typeof emails.$inferSelect;
export type NewEmail = typeof emails.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type WorkflowEvent = typeof workflowEvents.$inferSelect;
export type NewWorkflowEvent = typeof workflowEvents.$inferInsert;
