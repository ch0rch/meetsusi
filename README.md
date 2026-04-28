# Meet Susi

> **Everyone deserves a Susi.**

Susi is a personal negotiation agent that works by email on your behalf. You tell her what you want to negotiate and how much you're paying. She researches market prices, drafts emails, handles counter-offers, and only interrupts you when she's got a good deal.

Built for the Vercel **Zero to Agent** hackathon (April 24 → May 3, 2026).

## What Susi does

- **You describe** what you want to negotiate (SaaS renewal, car, rent, services).
- **Susi researches** market prices and competitor benchmarks.
- **Susi drafts** the first email — you approve before anything goes out.
- **A durable workflow takes over** the negotiation. It can wait days for a vendor reply without consuming resources.
- **Susi reports back** when there's news: vendor replied, deal closed, walked away.
- **You only see relevant updates** — drafts to approve, final results, savings achieved.

## Architecture in one sentence

A Next.js chat UI on top of a [Vercel Workflow SDK](https://workflow-sdk.dev/)–powered durable agent that sends and receives email through Cloudflare Email Service.

```
┌────────────────┐                      ┌──────────────────────┐
│   Chat (UI)    │ ── streamText ────▶  │ Claude Sonnet 4.6    │
│  Next.js 16    │                      │ via AI SDK 6         │
└────────┬───────┘                      └──────────────────────┘
         │ user approves first email
         ▼
┌─────────────────────────────────────────────────────────┐
│  runNegotiation() — durable workflow                    │
│  • send email (step)                                    │
│  • wait for vendor reply (signal, days OK)              │
│  • classify reply (LLM step)                            │
│  • request user approval (signal)                       │
│  • iterate up to 8 rounds                               │
│  • mark won / lost                                      │
└────┬────────────────────────────┬───────────────────────┘
     │                            │
     ▼                            ▼
┌─────────────────────┐    ┌──────────────────────────┐
│ Cloudflare Email    │    │ /api/email/inbound       │
│ Sending             │    │ (HMAC + signal to        │
│                     │    │  workflow)               │
└─────────────────────┘    └──────────────────────────┘
```

## Stack

- **Next.js 16** (App Router) + React 19
- **Vercel AI SDK 6** — chat streaming and tools
- **Vercel Workflow SDK** — durable execution for negotiations
- **Drizzle ORM** + Supabase Postgres — schema, migrations, multi-tenant data
- **better-auth** with Google provider
- **Cloudflare Email Service** — Susi's own domain (`negotiate-[id]@meetsusi.com`)
- **Claude Sonnet 4.6** via Anthropic API
- **Tailwind 4** + shadcn-style Radix UI
- **Bun + Turborepo** monorepo

## Repo layout

```
apps/web         Next.js app — chat UI, auth, API routes, workflow handler
packages/agent   Susi's persona, tools, skills, system prompt
packages/shared  Shared utilities and hooks
docs/spec        Product brief + technical specs (v1, v2, v3)
docs/agents      Architecture and code style guidance for AI coding agents
```

## Local setup

```bash
bun install
cp apps/web/.env.example apps/web/.env
# fill in the env vars (see docs/spec/meetsusi-technical-spec-v3.md)
bun run web
```

Required env vars (minimum to boot):

```env
POSTGRES_URL=                    # Supabase connection string
JWE_SECRET=                      # openssl rand -base64 32
ENCRYPTION_KEY=                  # openssl rand -hex 32
ANTHROPIC_API_KEY=
```

For the full negotiation flow add:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_EMAIL_DOMAIN=meetsusi.com
CLOUDFLARE_WEBHOOK_SECRET=
TAVILY_API_KEY=                  # web search for market research
```

See [docs/spec/meetsusi-technical-spec-v3.md](docs/spec/meetsusi-technical-spec-v3.md) for the complete spec.

## Useful commands

```bash
bun run web         # Run dev server
bun run check       # Lint + format check (ultracite)
bun run fix         # Lint fix + format
bun run typecheck   # Type check all packages
bun run ci          # Full pipeline: check + typecheck + tests
```

## Acknowledgments

This project is built on top of [vercel-labs/open-agents](https://github.com/vercel-labs/open-agents), forked and adapted for negotiation rather than coding. The original framework's chat-streaming, durable workflow integration, and auth scaffolding made this possible to build in a 5-day hackathon.

## License

MIT — see [LICENSE.md](LICENSE.md).
