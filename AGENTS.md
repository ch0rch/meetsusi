# AGENTS.md

This file provides guidance for AI coding agents working in this repository.

## What this repo is

**Meet Susi** — a personal negotiation agent that works by email. Built for the Vercel "Zero to Agent" hackathon (April 24 → May 3, 2026). Forked from `vercel-labs/open-agents` and adapted for negotiation use cases.

See [README.md](README.md) for the product overview and [docs/spec/meetsusi-technical-spec-v3.md](docs/spec/meetsusi-technical-spec-v3.md) for the full technical spec.

**This is a living document.** When you make a mistake or learn something new, add it to [docs/agents/lessons-learned.md](docs/agents/lessons-learned.md).

## Quick links

- [Architecture & Workspace Structure](docs/agents/architecture.md)
- [Code Style & Patterns](docs/agents/code-style.md)
- [Lessons Learned](docs/agents/lessons-learned.md)
- [Product brief](docs/spec/meetsusi-hackathon.md)
- [Technical spec v3 (current)](docs/spec/meetsusi-technical-spec-v3.md)

## Architecture summary

```
Chat (Next.js + AI SDK) ──▶ Workflow SDK durable runs ──▶ Cloudflare Email
              │                       ▲
              │                       │
              ▼                       │
         Supabase Postgres ◀──────────┘
         (Drizzle ORM, RLS on with user-scoped policies + app-level filtering)
```

- **Chat** is synchronous, streaming, and reflects workflow state. It does NOT manage the negotiation directly.
- **The workflow** (`runNegotiation`) is the durable agent that survives crashes and waits days for replies.
- **The webhook** (`/api/email/inbound`) is dumb — it stores the inbound email and sends a signal to the workflow.

## Database & migrations

Schema lives in `apps/web/lib/db/schema.ts`. Migrations are managed by Drizzle Kit.

**After modifying `schema.ts`, always generate a migration:**

```bash
bun run --cwd apps/web db:generate
```

Commit the generated `.sql` alongside the schema change. **Do not use `db:push`** except for local throwaway databases.

Migrations run automatically during `bun run build` (via `lib/db/migrate.ts`), so every Vercel deploy applies pending migrations to its own database.

## Commands

```bash
# Development
bun run web

# Quality (run after any change)
bun run ci          # check + typecheck + tests
turbo typecheck     # types only
bun run check       # ultracite (oxlint + oxfmt)
bun run fix         # auto-fix lint + format

# Filter
turbo typecheck --filter=web

# Tests
bun test
bun test path/to/file.test.ts
bun test --watch
bun run test:verbose
```

**Execution rules:**
- Run checks through package scripts (`bun run ci`, `bun run --cwd apps/web db:check`).
- Prefer `bun run <script>` over invoking tool binaries directly so local matches CI.

## Git

- **Branch sync:** when bringing in `origin/main`, prefer `git fetch origin main` then `git merge origin/main` (no rebase unless asked).
- **Quote dynamic-route paths:** `git add "apps/web/app/negotiations/[id]/page.tsx"` — zsh treats `[id]` as a glob.
- **Conventional commits.** No "Co-Authored-By" trailers.

## Code style summary

- **Bun exclusively** (not Node/npm/pnpm).
- **Files**: kebab-case. **Types**: PascalCase. **Functions**: camelCase.
- **Never use `any`** — use `unknown` and narrow with type guards.
- **No `.js` extensions** in imports.
- **Ultracite** (oxlint + oxfmt). Double quotes, 2-space indent.
- **Zod** for validation; derive types with `z.infer`.

See [docs/agents/code-style.md](docs/agents/code-style.md) for full conventions.

## Hard rules for working on Susi

1. **Never let Susi send an email without explicit user approval.** Validate `email.status === 'approved'` at the workflow step level before any send.
2. **The agent (chat) does NOT write to the DB directly.** All DB ops go through tools or workflow steps.
3. **Webhook validates HMAC every time.** No exceptions.
4. **Workflow steps must be idempotent.** Retries should not duplicate emails or charges.
5. **No non-deterministic APIs** (`Date.now`, `Math.random`) inside `"use workflow"` function bodies — wrap them in steps.
6. **All `waitForSignal` calls have timeouts.** Avoid zombie workflows.
7. **Service-role keys never in the client.** Server-only.

## File organization

- Don't append new functionality to the bottom of an existing file by default.
- Prefer creating colocated files for distinct concerns (components, hooks, utilities, schemas, data-access helpers).
- Extract large feature behavior into colocated hooks and child components.
- Keep each file focused on one responsibility.
