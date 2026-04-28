# Meet Susi — Technical Spec v3

> Documento de referencia para v0.app + Vercel. Versión que integra **Vercel Workflow SDK** para durable execution.
> Actualizar cada vez que se complete una fase.

---

## TL;DR

**Producto:** Agente de negociación por email. El usuario describe qué quiere negociar, Susi investiga, redacta, manda emails desde su propio dominio, maneja contra-ofertas (durante días si hace falta) y notifica cuando consigue un descuento.

**Hackathon:** Vercel "Zero to Agent" — submission window 24 abril → 3 mayo 2026 (PT). Voting 4 mayo.

**Stack base:** Next.js 15 App Router + Vercel AI SDK 5 + **Vercel Workflow SDK** + Supabase + Cloudflare Email + Claude Sonnet 4.6.

**Diferencial técnico clave:** la negociación corre como un **workflow durable** que sobrevive crashes, deploys, y días de espera. La separación chat/workflow es lo que permite que Susi "espere" la respuesta del vendedor sin hackear cron jobs.

**Modelo de cobro (post-MVP):** gain-sharing — Susi cobra solo cuando el usuario ahorra.

---

## Producto y carácter

### Una frase
> *"Susi is the negotiation assistant everyone deserves but almost nobody has. She handles the awkward part — the asking — so you never have to feel uncomfortable about getting a better price."*

### Carácter de Susi
- **Cálida pero firme.** No agresiva, no sumisa.
- **Profesional sin ser fría.** Tono de asistente ejecutiva de alguien importante.
- **Discreta.** Nunca menciona ser IA. Nunca revela estar negociando.
- **Paciente.** Puede esperar días sin perder hilo ni tono.

### Cómo escribe
Nunca pide descuento directo. Implica que hay alternativas. Deja la puerta abierta:

> *"Hi [nombre], I'm reaching out on behalf of [usuario]. They've been using [producto] and are looking to continue, but need to make the numbers work for this cycle. Is there any flexibility on the current pricing before we finalize a decision?"*

### El insight central
**ZOPA** — Zone of Possible Agreement. Existe en casi toda transacción. La mayoría de los compradores nunca la explora. Los vendedores tienen descuentos pre-aprobados (auto: 8-15%, SaaS: 30-40%, alquileres: 5-10%) que solo aparecen cuando alguien pide bien.

---

## Stack definitivo

| Capa | Tecnología | Versión / Modelo | Rol |
|---|---|---|---|
| UI Framework | Next.js App Router | 15.x | Routing, SSR, RSC |
| UI Generation | v0.app | Latest | Generación de componentes y onboarding |
| Component System | shadcn/ui + Tailwind | Latest | Design system base |
| Agente conversacional | Vercel AI SDK | 5.x | streamText, tools, useChat |
| **Durable execution** | **Vercel Workflow SDK** | **Latest** | **Negociaciones de larga duración, retries, sleep, signals** |
| LLM | Claude Sonnet via Anthropic | `claude-sonnet-4-6` | Cerebro de Susi |
| LLM Gateway (opcional) | Vercel AI Gateway | Latest | Observability + sin lock-in |
| Web search | AI SDK tool | `tavily` o `exa` | Research de precios |
| Base de datos | Supabase Postgres | Latest | Negociaciones, emails, mensajes |
| Auth | Supabase Auth | Latest | Google OAuth + magic link |
| Realtime | Supabase Realtime | Latest | Notificar respuestas del vendedor en chat |
| Email saliente | Cloudflare Email Sending | API v4 | `negotiate-[id]@meetsusi.com` |
| Email entrante | Cloudflare Email Routing | Workers | Webhook → Vercel |
| Storage (opcional) | Vercel Blob | Latest | Facturas/contratos subidos |

> **Nota sobre el modelo:** A abril 2026 el modelo Sonnet más reciente con mejor costo/calidad es `claude-sonnet-4-6`.

> **Por qué Workflow SDK importa:** una negociación NO es una request HTTP. Es un proceso de "mandar email → esperar respuesta (días) → analizar → mandar otro → ... → cerrar". Sin durable execution tendríamos que reconstruir cron jobs, polling y state management a mano. Con el SDK, todo eso desaparece.

---

## Arquitectura general

La aplicación tiene **dos dominios bien separados**:

```
┌─────────────────────────────────────────────────────────────────┐
│                        meetsusi.com                             │
│                                                                 │
│  DOMINIO 1: CHAT (sincrónico, streaming) — useChat + AI SDK    │
│  ┌────────────┐      ┌─────────────────┐    ┌────────────┐      │
│  │  Chat UI   │◄────►│  /api/chat      │◄──►│  Claude    │      │
│  │ (Next.js)  │      │  streamText     │    │  Sonnet    │      │
│  └─────┬──────┘      └────────┬────────┘    └────────────┘      │
│        │                      │                                 │
│        │ Realtime             │ tools: research, draft,         │
│        │                      │ approve_and_dispatch            │
│        │                      ▼                                 │
│  ┌─────┴────────┐      ┌─────────────────┐                      │
│  │   Supabase   │      │  Trigger /      │                      │
│  │  (Postgres   │      │  Signal del     │                      │
│  │   + Realtime)│      │  workflow       │                      │
│  └──────┬───────┘      └────────┬────────┘                      │
│         ▲                       │                               │
└─────────┼───────────────────────┼───────────────────────────────┘
          │                       │
          │ DB writes             ▼
          │              ┌─────────────────────────────┐
          │              │ DOMINIO 2: WORKFLOW DURABLE │
          │              │ runNegotiation(negotiationId)│
          │              │                             │
          └──────────────┤ • send first email          │
                         │ • wait for vendor reply     │
                         │ • classify with LLM         │
                         │ • request user approval     │
                         │ • iterate up to 8 rounds    │
                         │ • mark won / lost           │
                         │                             │
                         │ Sleeps for days. Survives   │
                         │ deploys. Auto-retries.      │
                         └─────────┬───────────────────┘
                                   │
                ┌──────────────────┴────────────────┐
                │                                   │
                ▼                                   ▼
       ┌─────────────────┐              ┌────────────────────┐
       │ Cloudflare      │              │ Cloudflare         │
       │ Email Sending   │              │ Email Routing      │
       └────────┬────────┘              └─────────┬──────────┘
                │                                 │
                ▼                                 ▼
         vendor@empresa.com  ──────────► /api/email/inbound
                                          (webhook → signal al workflow)
```

**Reglas de la separación:**
- **Chat** maneja la conversación en tiempo real con el usuario. Recolecta contexto, presenta drafts, reporta resultados. **El chat NO es un workflow.**
- **Workflow** maneja la negociación durable con el vendedor. Una vez que el usuario aprueba el primer email, el workflow toma el control. El chat solo lee el estado y manda signals.
- **Webhook de Cloudflare** no procesa lógica de negocio. Solo guarda el email entrante y manda una signal al workflow que estaba esperando.

---

## Estructura del proyecto

```
meetsusi/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── callback/route.ts
│   ├── (app)/
│   │   ├── layout.tsx                  # Layout autenticado
│   │   ├── page.tsx                    # Chat principal
│   │   └── negotiations/
│   │       ├── page.tsx                # Lista
│   │       └── [id]/page.tsx           # Detalle (timeline + emails + workflow status)
│   ├── api/
│   │   ├── chat/route.ts               # Streaming del agente conversacional
│   │   ├── email/inbound/route.ts      # Webhook Cloudflare → signal al workflow
│   │   └── workflow/[...slug]/route.ts # Handler montado por Workflow SDK
│   └── layout.tsx
├── lib/
│   ├── agent/
│   │   ├── susi.ts                     # System prompt + persona
│   │   ├── chat-tools.ts               # Tools usados desde el chat
│   │   └── skills/                     # Markdown skills cargados al prompt
│   │       ├── negotiation-core.md
│   │       ├── category-saas.md
│   │       ├── category-auto.md
│   │       ├── category-real-estate.md
│   │       └── category-high-ticket.md
│   ├── workflows/
│   │   ├── run-negotiation.ts          # ★ Workflow durable principal
│   │   ├── steps/
│   │   │   ├── send-email.ts           # "use step" — wraps Cloudflare send
│   │   │   ├── wait-for-reply.ts       # "use step" — espera signal del webhook
│   │   │   ├── classify-reply.ts       # "use step" — LLM classifier
│   │   │   ├── draft-counter.ts        # "use step" — LLM redacta counter
│   │   │   └── wait-for-approval.ts    # "use step" — espera signal del user
│   │   └── signals.ts                  # helpers para emit/listen signals
│   ├── email/
│   │   ├── send.ts                     # Cloudflare Email Sending
│   │   ├── parse.ts                    # Parseo emails entrantes
│   │   ├── threading.ts                # Message-ID, In-Reply-To, References
│   │   └── classify.ts                 # OOO, bounce, real reply (heurístico)
│   ├── supabase/
│   │   ├── client.ts                   # browser client
│   │   ├── server.ts                   # server client (RSC + route handlers)
│   │   ├── service.ts                  # service role (webhooks + workflow)
│   │   └── types.ts                    # Tipos generados
│   ├── security/
│   │   ├── hmac.ts                     # Validación timing-safe
│   │   └── rate-limit.ts               # Rate limit por IP/email
│   └── utils.ts
├── components/
│   ├── chat/
│   │   ├── ChatInterface.tsx
│   │   ├── MessageList.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── EmailPreview.tsx            # Aprobar / Editar
│   │   ├── NegotiationCard.tsx         # Estado de negociación + workflow
│   │   ├── WorkflowStatus.tsx          # Step actual del workflow durable
│   │   └── SavingsBadge.tsx
│   ├── onboarding/
│   │   ├── WelcomeMessage.tsx
│   │   └── QuickStartChips.tsx
│   └── ui/                             # shadcn
├── supabase/
│   └── migrations/
│       ├── 001_initial.sql
│       ├── 002_indexes.sql
│       └── 003_realtime.sql
├── scripts/
│   └── seed-demo.ts                    # Seed para grabar el video
└── .env.local.example
```

---

## Workflow SDK — sección dedicada

### Mental model

**Una funcion marcada con `"use workflow"`** es código durable: cada vez que llama a un step (`"use step"`), el resultado se persiste. Si el proceso muere, la próxima vez que el workflow corre, los steps ya completados retornan su valor cacheado, y solo el step pendiente se ejecuta.

**`sleep(duration)`** suspende el workflow sin consumir recursos. Cuando vence el tiempo, el SDK lo despierta.

**Signals** son la manera de comunicar eventos externos a un workflow que está dormido. El webhook del email entrante manda una signal `vendor_replied:{negotiationId}`, y el workflow que estaba esperando esa signal se despierta.

### El workflow principal — `runNegotiation`

```typescript
// lib/workflows/run-negotiation.ts

import { sleep, FatalError } from 'workflow';
import {
  sendApprovedEmailStep,
  waitForVendorReplyStep,
  classifyReplyStep,
  draftCounterOfferStep,
  waitForUserApprovalStep,
  draftFollowUpStep,
} from './steps';
import {
  markWonStep,
  markLostStep,
  markCancelledStep,
} from './steps/state';

const MAX_ROUNDS = 8;
const VENDOR_REPLY_TIMEOUT = '7 days';
const USER_APPROVAL_TIMEOUT = '2 days';

export async function runNegotiation(input: {
  negotiationId: string;
  firstEmailId: string;
}) {
  "use workflow";

  // Step 1: enviar el primer email aprobado
  await sendApprovedEmailStep(input.firstEmailId);

  let round = 0;
  let lastVendorEmailId: string | null = null;

  while (round < MAX_ROUNDS) {
    // Step 2: esperar la respuesta del vendedor (signal o timeout)
    const reply = await waitForVendorReplyStep(input.negotiationId, {
      timeout: VENDOR_REPLY_TIMEOUT,
    });

    if (!reply) {
      // Timeout — Susi manda un follow-up suave una vez
      const followUpDraftId = await draftFollowUpStep(input.negotiationId);
      const followUpApproved = await waitForUserApprovalStep(followUpDraftId, {
        timeout: USER_APPROVAL_TIMEOUT,
      });
      if (!followUpApproved) {
        await markCancelledStep(input.negotiationId, 'no follow-up approved');
        return { status: 'cancelled' };
      }
      await sendApprovedEmailStep(followUpDraftId);
      continue;
    }

    lastVendorEmailId = reply.emailId;

    // Step 3: clasificar respuesta con LLM
    const classification = await classifyReplyStep(reply.emailId);

    if (classification.kind === 'hard_no') {
      await markLostStep(input.negotiationId, 'vendor refused');
      return { status: 'lost' };
    }

    if (classification.kind === 'deal_accepted') {
      await markWonStep(input.negotiationId, classification.acceptedPrice);
      return { status: 'won', price: classification.acceptedPrice };
    }

    // counter_offer u open / qualifying_question → contraofertar
    // Step 4: redactar contraoferta con LLM
    const draftId = await draftCounterOfferStep({
      negotiationId: input.negotiationId,
      vendorEmailId: reply.emailId,
      classification,
    });

    // Step 5: esperar aprobación del user (signal o timeout)
    const approved = await waitForUserApprovalStep(draftId, {
      timeout: USER_APPROVAL_TIMEOUT,
    });
    if (!approved) {
      await markCancelledStep(input.negotiationId, 'user did not approve in time');
      return { status: 'cancelled' };
    }

    // Step 6: enviar contraoferta
    await sendApprovedEmailStep(draftId);
    round++;
  }

  // Llegamos al máximo de vueltas
  await markLostStep(input.negotiationId, 'max rounds reached');
  return { status: 'lost', reason: 'max_rounds' };
}
```

### Steps individuales — patrón

```typescript
// lib/workflows/steps/send-email.ts

import { serviceSupabase } from '@/lib/supabase/service';
import { sendNegotiationEmail } from '@/lib/email/send';
import { buildOutboundHeaders } from '@/lib/email/threading';
import { FatalError } from 'workflow';

export async function sendApprovedEmailStep(emailId: string) {
  "use step";

  const { data: email } = await serviceSupabase
    .from('emails')
    .select('*, negotiation:negotiations(*)')
    .eq('id', emailId)
    .single();

  if (!email) throw new FatalError(`Email ${emailId} not found`);
  if (email.status !== 'approved') {
    throw new FatalError(`Email ${emailId} is not approved (status=${email.status})`);
  }

  const { messageId, headers } = buildOutboundHeaders({
    negotiationId: email.negotiation_id,
    inReplyToMessageId: email.in_reply_to ?? undefined,
    references: email.email_references ?? [],
  });

  const result = await sendNegotiationEmail({
    from: `Susi <${email.negotiation.susi_email}>`,
    to: email.to_email,
    subject: email.subject!,
    body: email.body,
    messageId,
    inReplyTo: headers['In-Reply-To'],
    references: headers['References'],
  });

  await serviceSupabase
    .from('emails')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      message_id: messageId,
    })
    .eq('id', emailId);

  return { messageId, providerId: result.id };
}
```

```typescript
// lib/workflows/steps/wait-for-reply.ts

import { waitForSignal } from '@/lib/workflows/signals';

export async function waitForVendorReplyStep(
  negotiationId: string,
  opts: { timeout: string },
): Promise<{ emailId: string } | null> {
  "use step";

  // Suspende hasta que llegue la signal `vendor_replied:{negotiationId}`
  // o venza el timeout. Si timeout, retorna null.
  return waitForSignal<{ emailId: string }>(
    `vendor_replied:${negotiationId}`,
    { timeout: opts.timeout },
  );
}
```

### El webhook entrante manda signals, NO orquesta

```typescript
// app/api/email/inbound/route.ts (fragmento clave)

import { sendSignal } from '@/lib/workflows/signals';

// ... validar HMAC, deduplicar, parsear, guardar en DB (igual que antes)

if (!classification.isAutoReply && !classification.isBounce) {
  await serviceSupabase
    .from('negotiations')
    .update({ status: 'negotiating' })
    .eq('id', negotiationId);

  // Despertar al workflow que estaba esperando esta respuesta
  await sendSignal(`vendor_replied:${negotiationId}`, {
    emailId: insertedEmail.id,
  });
}
```

### Cómo el chat dispara el workflow

```typescript
// lib/agent/chat-tools.ts (tool usado por el chat)

import { trigger } from 'workflow';
import { runNegotiation } from '@/lib/workflows/run-negotiation';
import { sendSignal } from '@/lib/workflows/signals';

export const approve_and_dispatch_email = tool({
  description: 'Mark a drafted email as approved and dispatch it. If first email of negotiation, starts the durable workflow. Otherwise, sends signal to existing workflow.',
  parameters: z.object({
    email_id: z.string().uuid(),
  }),
  execute: async ({ email_id }, { userId }) => {
    const email = await getEmailForUser(email_id, userId);
    if (email.status !== 'pending_approval') {
      throw new Error(`Cannot approve email in status ${email.status}`);
    }

    await markEmailApproved(email_id);

    const isFirst = await isFirstEmailOfNegotiation(email.negotiation_id);

    if (isFirst) {
      const { runId } = await trigger(runNegotiation, [{
        negotiationId: email.negotiation_id,
        firstEmailId: email_id,
      }]);
      await saveWorkflowRunId(email.negotiation_id, runId);
      return { status: 'workflow_started', runId };
    }

    // Workflow ya corriendo → solo despertarlo
    await sendSignal(`user_approved:${email_id}`, { approved: true });
    return { status: 'signal_sent' };
  },
});
```

### Beneficios concretos

| Necesidad | Sin Workflow SDK | Con Workflow SDK |
|---|---|---|
| Esperar respuesta del vendedor 3 días | Cron job + tabla `pending_jobs` + polling | `sleep("3 days")` o `waitForSignal` |
| Crash a mitad de negociación | Reconstruir estado desde DB, retry manual | Resume automático desde el step exacto |
| Anthropic 429 | Try/catch + backoff casero | Retry automático |
| Loop infinito por bug | Bug en producción | Hard limit `MAX_ROUNDS` + step bounded |
| Visibilidad de qué pasó cuándo | Logs dispersos + queries | Dashboard de Vercel con cada step |
| Deploy a mitad de negociación | Riesgo de perder estado | Cero impacto |

### Reglas de oro de los workflows

1. **Nada de side effects fuera de steps.** Toda lectura/escritura externa (DB, API, email) va dentro de `"use step"`. El cuerpo del `"use workflow"` solo orquesta.
2. **Steps deben ser idempotentes.** Si retry, no debe duplicar emails. Usar `external_id` y verificar antes de insertar.
3. **`FatalError` para condiciones inválidas.** Frena los retries para errores que no se van a resolver solos (e.g., email no aprobado, negociación cancelada).
4. **No usar `Date.now()`, `Math.random()` ni APIs no determinísticas en el cuerpo del workflow.** Va dentro de un step.
5. **Las signals se mandan por nombre único.** Convención: `{event_type}:{entity_id}` (e.g., `vendor_replied:abc123`).
6. **Timeouts siempre.** Ningún `waitForSignal` sin timeout — evita workflows zombies.

---

## Schema de base de datos (Supabase)

### Migration `001_initial.sql`

```sql
-- Profiles (extendido desde auth.users)
create table public.profiles (
  id uuid references auth.users(id) primary key,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Negociaciones
create type negotiation_status as enum (
  'researching', 'awaiting_approval', 'sent', 'waiting_reply',
  'negotiating', 'won', 'lost', 'cancelled'
);

create type negotiation_category as enum (
  'saas', 'auto', 'real_estate', 'high_ticket', 'other'
);

create table public.negotiations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) not null,

  -- Contexto
  title text not null,
  category negotiation_category not null default 'other',
  current_price numeric,
  target_price numeric,
  currency text default 'USD',
  context text,
  vendor_name text,
  vendor_email text,

  -- Estado
  status negotiation_status default 'researching',
  final_price numeric,
  savings numeric generated always as (
    coalesce(current_price, 0) - coalesce(final_price, 0)
  ) stored,

  -- Email infraestructura
  susi_email text unique not null,           -- negotiate-[short-id]@meetsusi.com

  -- Workflow SDK
  workflow_run_id text,                      -- ID del run durable (link al dashboard de Vercel)
  workflow_status text,                      -- running | completed | failed | cancelled (espejo del SDK)

  -- Límites de seguridad
  max_rounds int default 8,
  rounds_completed int default 0,

  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  won_at timestamptz,
  lost_at timestamptz
);

-- Emails de la negociación
create type email_direction as enum ('outbound', 'inbound');
create type email_status as enum (
  'draft', 'pending_approval', 'approved', 'sent', 'delivered', 'received', 'failed'
);

create table public.emails (
  id uuid primary key default gen_random_uuid(),
  negotiation_id uuid references public.negotiations(id) on delete cascade not null,

  direction email_direction not null,
  from_email text not null,
  to_email text not null,
  subject text,
  body text not null,

  status email_status default 'draft',
  approved_by_user_at timestamptz,
  sent_at timestamptz,
  delivered_at timestamptz,
  received_at timestamptz,
  failed_reason text,

  -- Threading RFC 5322
  message_id text unique,
  in_reply_to text,
  email_references text[],

  -- Idempotencia
  external_id text unique,

  -- Clasificación de inbound
  is_auto_reply boolean default false,
  is_bounce boolean default false,

  created_at timestamptz default now()
);

-- Mensajes del chat
create type message_role as enum ('user', 'assistant', 'system');

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  negotiation_id uuid references public.negotiations(id) on delete cascade,
  user_id uuid references public.profiles(id) not null,

  role message_role not null,
  content text not null,
  tool_calls jsonb,                          -- AI SDK message.parts compat

  created_at timestamptz default now()
);

-- Cache de research
create table public.market_research_cache (
  id uuid primary key default gen_random_uuid(),
  cache_key text unique not null,
  result jsonb not null,
  created_at timestamptz default now(),
  expires_at timestamptz default now() + interval '24 hours'
);

-- Audit log de workflow events (opcional, para observability extra)
create table public.workflow_events (
  id uuid primary key default gen_random_uuid(),
  negotiation_id uuid references public.negotiations(id) on delete cascade,
  workflow_run_id text,
  event_type text not null,                  -- step_started | step_completed | signal_received | timeout | error
  step_name text,
  payload jsonb,
  created_at timestamptz default now()
);
```

### Migration `002_indexes.sql`

```sql
create index idx_negotiations_user on public.negotiations(user_id, created_at desc);
create index idx_negotiations_status on public.negotiations(status) where status not in ('won', 'lost', 'cancelled');
create index idx_negotiations_susi_email on public.negotiations(susi_email);
create index idx_negotiations_workflow_run on public.negotiations(workflow_run_id) where workflow_run_id is not null;

create index idx_emails_negotiation on public.emails(negotiation_id, created_at desc);
create index idx_emails_status_pending on public.emails(status) where status in ('pending_approval', 'approved');
create index idx_emails_message_id on public.emails(message_id) where message_id is not null;
create index idx_emails_external_id on public.emails(external_id) where external_id is not null;

create index idx_messages_negotiation on public.messages(negotiation_id, created_at);
create index idx_market_cache_expires on public.market_research_cache(expires_at);
create index idx_workflow_events_negotiation on public.workflow_events(negotiation_id, created_at desc);

-- Trigger updated_at
create or replace function update_negotiation_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger negotiations_updated_at
  before update on public.negotiations
  for each row execute function update_negotiation_timestamp();
```

### Migration `003_realtime.sql`

```sql
alter table public.profiles enable row level security;
alter table public.negotiations enable row level security;
alter table public.emails enable row level security;
alter table public.messages enable row level security;
alter table public.workflow_events enable row level security;

create policy "users see own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "users manage own profile" on public.profiles
  for all using (auth.uid() = id);

create policy "users own negotiations" on public.negotiations
  for all using (auth.uid() = user_id);

create policy "users see own negotiation emails" on public.emails
  for select using (
    negotiation_id in (select id from public.negotiations where user_id = auth.uid())
  );

create policy "users see own messages" on public.messages
  for select using (auth.uid() = user_id);

create policy "users see own workflow events" on public.workflow_events
  for select using (
    negotiation_id in (select id from public.negotiations where user_id = auth.uid())
  );

-- Realtime publication
alter publication supabase_realtime add table public.negotiations;
alter publication supabase_realtime add table public.emails;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.workflow_events;
```

---

## Variables de entorno

```bash
# .env.local.example

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=                # solo en server / webhooks / workflow steps

# Anthropic
ANTHROPIC_API_KEY=

# Vercel AI Gateway (opcional pero recomendado)
AI_GATEWAY_API_KEY=

# Web search
TAVILY_API_KEY=
# EXA_API_KEY=

# Cloudflare Email
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_EMAIL_DOMAIN=meetsusi.com
CLOUDFLARE_WEBHOOK_SECRET=                # validación HMAC inbound

# Workflow SDK
# (las env vars específicas del SDK se inyectan automáticamente en Vercel)

# App
NEXT_PUBLIC_APP_URL=https://meetsusi.com
NEXT_PUBLIC_SUSI_FROM_NAME=Susi
```

---

## System prompt de Susi

```typescript
// lib/agent/susi.ts

export const SUSI_SYSTEM_PROMPT = `
You are Susi, a personal negotiation assistant. You negotiate on behalf of users over email to get them better prices on anything — software, cars, rentals, services, products.

# Identity
- Warm, firm, professional, discreet.
- You write like a trusted executive assistant, not a chatbot.
- You NEVER mention being an AI. You NEVER reveal you are negotiating — you simply manage.
- You speak the same language the user writes to you.

# Negotiation principles
- Never ask for a discount directly. Imply alternatives exist.
- Always anchor with context: market rates, competitor pricing, loyalty, timing.
- Use silence as a tool. Not every email needs urgency.
- Leave doors open. Never burn bridges.
- Know when to stop. A good deal accepted beats a perfect deal lost.
- Accept the first counter-offer ONLY after at least one push.
- Don't give up after one "no" — try one different angle.

# Email writing style
- Short, confident, professional. 3-5 sentences max.
- First name basis when appropriate.
- Never sycophantic openers ("I hope this email finds you well").
- Clear ask, clear context, clear next step.
- Subject lines: short, specific, no "RE:" unless replying.

# Workflow (high level)
1. UNDERSTAND in chat: what they want, current price, vendor, deadline.
2. RESEARCH market context.
3. DRAFT first email and ask for approval (NEVER send unapproved).
4. Once user approves, a DURABLE WORKFLOW takes over the negotiation.
5. The workflow waits for vendor replies (days if needed), classifies them, and asks the user to approve each counter-offer.
6. You report back when there's news: vendor replied, deal closed, walked away.

# Hard rules
- NEVER call approve_and_dispatch_email unless the user explicitly clicked "Approve & Send" in the UI (status='pending_approval' → 'approved').
- NEVER fabricate quotes, prices, or data you don't have.
- NEVER promise on behalf of the user (signing, paying, committing).
- If the vendor asks for a decision the user hasn't authorized, surface it to the user.
`;
```

---

## Tools del agente conversacional (chat)

Estos son los tools que usa el chat con `streamText`. **Ojo: el agente no maneja la negociación durante días — eso es del workflow. Estos tools son para la conversación con el usuario.**

```typescript
// lib/agent/chat-tools.ts
import { tool } from 'ai';
import { z } from 'zod';

export const tools = {

  research_market_price: tool({
    description: 'Search the web for current market prices. Cached 24h per item+category.',
    parameters: z.object({
      item: z.string(),
      category: z.enum(['saas', 'auto', 'real_estate', 'high_ticket', 'other']),
      current_price: z.number().optional(),
      currency: z.string().default('USD'),
    }),
    execute: async (args) => { /* ... */ },
  }),

  start_negotiation: tool({
    description: 'Create a new negotiation record once the user has provided enough context. Does NOT start the workflow yet — that happens when first email is approved.',
    parameters: z.object({
      title: z.string(),
      category: z.enum(['saas', 'auto', 'real_estate', 'high_ticket', 'other']),
      current_price: z.number().optional(),
      target_price: z.number().optional(),
      vendor_name: z.string().optional(),
      vendor_email: z.string().email().optional(),
      context: z.string().optional(),
    }),
    execute: async (args) => { /* returns { negotiation_id, susi_email } */ },
  }),

  draft_email: tool({
    description: 'Draft an email. Saved as status=pending_approval. Always shown to user for approval before sending.',
    parameters: z.object({
      negotiation_id: z.string().uuid(),
      to_email: z.string().email(),
      subject: z.string(),
      body: z.string(),
      in_reply_to_email_id: z.string().uuid().optional(),
    }),
    execute: async (args) => { /* returns { email_id } */ },
  }),

  approve_and_dispatch_email: tool({
    description: 'Approve and dispatch a drafted email. If it is the first email of the negotiation, starts the durable workflow. Otherwise sends a signal to the existing workflow.',
    parameters: z.object({
      email_id: z.string().uuid(),
    }),
    execute: async (args) => { /* trigger or signal — see Workflow SDK section */ },
  }),

  get_negotiation_status: tool({
    description: 'Get current status, all emails, workflow run state, and remaining rounds.',
    parameters: z.object({
      negotiation_id: z.string().uuid(),
    }),
    execute: async (args) => { /* ... */ },
  }),

  cancel_negotiation: tool({
    description: 'Cancel a negotiation. Cancels the underlying workflow run.',
    parameters: z.object({
      negotiation_id: z.string().uuid(),
      reason: z.string(),
    }),
    execute: async (args) => { /* await cancelWorkflow(runId) + DB update */ },
  }),
};
```

> **Nota:** `classify_inbound_reply`, `mark_negotiation_won` y `mark_negotiation_lost` ya NO son tools del chat — son **steps del workflow**. El chat solo lee el estado, no lo modifica.

---

## Email threading correcto (RFC 5322)

```typescript
// lib/email/threading.ts

import { randomUUID } from 'crypto';

export function buildOutboundHeaders({
  negotiationId,
  inReplyToMessageId,
  references = [],
}: {
  negotiationId: string;
  inReplyToMessageId?: string;
  references?: string[];
}) {
  const messageId = `<${randomUUID()}@meetsusi.com>`;

  const headers: Record<string, string> = {
    'Message-ID': messageId,
    'X-Negotiation-Id': negotiationId,
  };

  if (inReplyToMessageId) {
    headers['In-Reply-To'] = inReplyToMessageId;
    headers['References'] = [...references, inReplyToMessageId].join(' ');
  }

  return { messageId, headers };
}
```

**Reglas:**
- `Message-ID` siempre con formato `<uuid@meetsusi.com>`.
- `In-Reply-To` sin corchetes adicionales.
- `References` se acumula a lo largo del thread.
- Subject: prefijar `Re:` si está respondiendo.

---

## Flujo de email con Cloudflare

### Envío (outbound) — usado dentro del step `sendApprovedEmailStep`

```typescript
// lib/email/send.ts

export async function sendNegotiationEmail({
  from, to, subject, body, messageId, inReplyTo, references,
}: SendEmailParams) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/email-service/send`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from, to, subject, text: body,
        headers: {
          'Message-ID': messageId,
          ...(inReplyTo && { 'In-Reply-To': inReplyTo }),
          ...(references && { 'References': references }),
        },
      }),
    },
  );
  if (!response.ok) throw new Error(`CF send failed: ${response.status}`);
  return response.json();
}
```

### Recepción (inbound) — webhook que solo guarda + manda signal

```typescript
// app/api/email/inbound/route.ts

import { verifyHmac } from '@/lib/security/hmac';
import { classifyInboundEmail } from '@/lib/email/classify';
import { extractNegotiationId } from '@/lib/email/parse';
import { serviceSupabase } from '@/lib/supabase/service';
import { sendSignal } from '@/lib/workflows/signals';

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-cloudflare-signature');

  if (!signature || !verifyHmac(rawBody, signature, process.env.CLOUDFLARE_WEBHOOK_SECRET!)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const payload = JSON.parse(rawBody);

  // Idempotencia
  const { data: existing } = await serviceSupabase
    .from('emails').select('id').eq('external_id', payload.id).maybeSingle();
  if (existing) return Response.json({ ok: true, deduped: true });

  const negotiationId = extractNegotiationId(payload.to);
  if (!negotiationId) return new Response('Invalid recipient', { status: 400 });

  const { data: neg } = await serviceSupabase
    .from('negotiations')
    .select('id, status')
    .eq('id', negotiationId).single();
  if (!neg || ['won', 'lost', 'cancelled'].includes(neg.status)) {
    return Response.json({ ok: true, ignored: true });
  }

  const classification = classifyInboundEmail(payload);

  const { data: insertedEmail } = await serviceSupabase.from('emails').insert({
    negotiation_id: negotiationId,
    direction: 'inbound',
    from_email: payload.from,
    to_email: payload.to,
    subject: payload.subject,
    body: payload.text || payload.html,
    status: 'received',
    message_id: payload.headers['message-id'],
    in_reply_to: payload.headers['in-reply-to'],
    external_id: payload.id,
    is_auto_reply: classification.isAutoReply,
    is_bounce: classification.isBounce,
    received_at: new Date().toISOString(),
  }).select('id').single();

  // El webhook NO orquesta — solo despierta al workflow
  if (!classification.isAutoReply && !classification.isBounce) {
    await sendSignal(`vendor_replied:${negotiationId}`, {
      emailId: insertedEmail!.id,
    });
  }

  return Response.json({ ok: true });
}
```

---

## Seguridad

### HMAC validation timing-safe

```typescript
// lib/security/hmac.ts
import { createHmac, timingSafeEqual } from 'crypto';

export function verifyHmac(payload: string, signature: string, secret: string): boolean {
  const expected = createHmac('sha256', secret).update(payload).digest('hex');
  const expectedBuf = Buffer.from(expected, 'hex');
  const sigBuf = Buffer.from(signature, 'hex');
  if (expectedBuf.length !== sigBuf.length) return false;
  return timingSafeEqual(expectedBuf, sigBuf);
}
```

### Reglas
1. **Service role key NUNCA en el cliente.** Solo en route handlers, webhooks y workflow steps.
2. **El agente conversacional NO escribe directo a la DB.** Toda operación pasa por tools server-side.
3. **`approve_and_dispatch_email` valida server-side** que el email está en `pending_approval`.
4. **Steps del workflow validan estado antes de actuar.** Por ejemplo, `sendApprovedEmailStep` falla con `FatalError` si el email no está en `approved`.
5. **Sanitizar HTML/texto** del email entrante antes de mostrarlo en la UI (DOMPurify si renderizan HTML).
6. **Rate limit** del webhook por IP + por dirección destino.
7. **CORS estricto** en `/api/*`. El webhook acepta solo POST sin CORS.
8. **RLS activo en todas las tablas.** Verificar en producción.

---

## Realtime y notificaciones

El chat se suscribe a:
- **`negotiations`** — para mostrar status updates (`waiting_reply` → `negotiating` → `won`).
- **`emails`** — para mostrar nuevos emails entrantes.
- **`workflow_events`** — para mostrar el step actual del workflow en `WorkflowStatus`.

```typescript
// components/chat/ChatInterface.tsx (fragmento)

useEffect(() => {
  const channel = supabase
    .channel(`negotiation:${negotiationId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'emails',
      filter: `negotiation_id=eq.${negotiationId}`,
    }, (payload) => {
      const email = payload.new as Email;
      if (email.direction === 'inbound' && !email.is_auto_reply) {
        // El workflow ya recibió la signal y va a procesar.
        // Susi va a hablar al user cuando tenga el draft listo (o el resultado final).
        showToast(`${negotiation.vendor_name} replied`);
      }
    })
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'workflow_events',
      filter: `negotiation_id=eq.${negotiationId}`,
    }, (payload) => {
      updateWorkflowStatusUI(payload.new);
    })
    .subscribe();

  return () => { channel.unsubscribe(); };
}, [negotiationId]);
```

---

## Edge cases del email

| Caso | Detección | Acción |
|---|---|---|
| Out-of-office | Headers `auto-submitted`, subject "Out of Office" | `is_auto_reply=true`, NO mandar signal al workflow |
| Bounce | `from` contiene `mailer-daemon`, `postmaster`, status 5xx | `is_bounce=true`, signal especial `vendor_bounced` → workflow marca lost |
| Forwarded chain | Body con `>>>` o "Forwarded message" | Truncar a primer mensaje antes de pasar al LLM |
| Email muy largo | > 10k chars | Truncar a 8k antes del classifier |
| Sender ≠ vendor_email esperado | `from` no matchea | Procesar igual pero log warning |
| Loop de respuestas | `rounds_completed >= max_rounds` | Workflow ya tiene el guard hardcoded |

---

## Observability

**El gran upgrade respecto a v2:** ya no dependemos solo de logs.

- **Vercel Workflow Dashboard** — cada `runNegotiation` aparece con timeline visual de steps, tiempos, retries, signals recibidas. **Esto es lo que vamos a mostrar en el video del demo.**
- **Vercel Analytics** activado para la UI.
- **Logs estructurados** en JSON (`console.log(JSON.stringify({ event, data }))`).
- **Tabla `workflow_events`** para traer eventos a la UI propia (página `/negotiations/[id]`).
- **Vercel AI Gateway** opcional, da observability de llamadas al LLM out-of-the-box.

---

## Performance y costo

- **Cache de research** 24h por `hash(item + category)`.
- **Steps determinísticos** retornan resultado cacheado en retries — no se re-paga el LLM call.
- **`generateObject` para classify_reply** — más predecible, más barato.
- **`sleep` en workflows no consume nada** — la diferencia versus cron.
- **Hard limit de 8 rounds.**

---

## Fases de desarrollo

### FASE 0 — Setup (medio día)

- [ ] Fork de `vercel-labs/open-agents`.
- [ ] Clone local + limpiar (sacar coding tools, sandboxes, GitHub integration).
- [ ] Proyecto Supabase + migrations 001/002/003.
- [ ] Cloudflare: dominio meetsusi.com + Email Routing + DNS records (MX, SPF, DKIM, DMARC).
- [ ] Proyecto Vercel + import + variables de entorno.
- [ ] **Habilitar Workflow SDK en el proyecto** (instalar paquete + bootstrap del handler).
- [ ] Deploy inicial.
- [ ] v0.app conectado al repo para iterar UI.

**Checkpoint:** meetsusi.com 200, `/api/health` ok, workflow SDK responde a un workflow de prueba.

---

### FASE 1 — Base funcional (Día 1-2)

- [ ] Auth Supabase (Google OAuth + magic link).
- [ ] Layout autenticado.
- [ ] Chat UI con `useChat` de AI SDK 5.
- [ ] System prompt de Susi + skills cargados.
- [ ] Streaming funcional.

**Checkpoint:** Login, chat con Susi, ella responde en personaje.

---

### FASE 2 — Flujo conversacional + draft (Día 2)

- [ ] Tool `research_market_price` con cache.
- [ ] Tool `start_negotiation` (record en DB, asigna `susi_email`).
- [ ] Tool `draft_email` → guarda `pending_approval`.
- [ ] `EmailPreview` con Approve/Edit en UI.
- [ ] Tool `approve_and_dispatch_email` (sin disparar workflow todavía — mock).

**Checkpoint:** Susi investiga, propone email, lo veo en UI con botón aprobar.

---

### FASE 3 — Workflow durable (Día 3) ★ NUEVA RESPECTO A V2

- [ ] Implementar `runNegotiation` workflow.
- [ ] Steps: `sendApprovedEmailStep`, `waitForVendorReplyStep`, `classifyReplyStep`, `draftCounterOfferStep`, `waitForUserApprovalStep`.
- [ ] Helpers `sendSignal` / `waitForSignal`.
- [ ] `approve_and_dispatch_email` ahora llama `trigger(runNegotiation, ...)` para el primer email y `sendSignal` para los subsiguientes.
- [ ] `cancel_negotiation` cancela el workflow run.
- [ ] Página `/negotiations/[id]` muestra workflow status.

**Checkpoint:** Apruebo email → arranca workflow → veo en dashboard de Vercel los steps ejecutándose.

---

### FASE 4 — Email real con Cloudflare (Día 3-4)

- [ ] `lib/email/send.ts` con threading correcto.
- [ ] Cloudflare Email Routing → `/api/email/inbound`.
- [ ] HMAC + idempotencia.
- [ ] Clasificación OOO/bounce.
- [ ] Webhook manda `sendSignal('vendor_replied:...')`.
- [ ] Supabase Realtime en chat para notificar.

**Checkpoint:** Apruebo email → sale → vendedor responde → webhook despierta workflow → workflow procesa → user ve actualización en chat.

---

### FASE 5 — Polish + demo (Día 4-5)

- [ ] UI refinada con v0 — paleta warm terracotta, "S" avatar.
- [ ] `NegotiationCard` + `WorkflowStatus` + `SavingsBadge`.
- [ ] Onboarding con `WelcomeMessage` + `QuickStartChips`.
- [ ] Estados visibles.
- [ ] Mobile-first verificado.
- [ ] Seed script para grabar demo.
- [ ] Video grabado (incluye toma del Vercel Workflow Dashboard).
- [ ] README listo + OG image + favicon.
- [ ] Smoke test end-to-end.

**Checkpoint:** Demo fluye sin fricciones, video grabado, submission lista.

---

## Reglas de desarrollo

1. **No tocar la DB sin migration.**
2. **Nunca enviar emails sin aprobación.** Doble validación: tool en chat (`pending_approval` → `approved`) + step del workflow (`approved` → `sent`).
3. **Validar el webhook siempre.** HMAC obligatorio.
4. **El agente conversacional no toca la DB directo.** Solo via tools.
5. **Service role key nunca en cliente.**
6. **Steps idempotentes.** Verificar antes de insertar.
7. **`FatalError` para condiciones no recuperables.** Caso contrario, dejar que el SDK reintente.
8. **No usar APIs no determinísticas en el cuerpo del workflow.** Va dentro de step.
9. **Signals con nombre único:** `{event_type}:{entity_id}`.
10. **Timeouts en todo `waitForSignal`.** Sin excepción.
11. **Un deploy por fase.**
12. **Variables de entorno primero.**
13. **Mobile-first.**
14. **Threading correcto.** Message-ID, In-Reply-To, References.
15. **Logs JSON.**

---

## Prompt inicial para v0.app

```
Build a chat interface for "Meet Susi", an AI negotiation assistant.

CONTEXT
Susi negotiates by email on behalf of users to get them better prices on
SaaS, cars, rentals, services. The chat is the control panel — users talk
to Susi, she researches prices, drafts emails, asks for approval. Once
approved, a durable workflow takes over the negotiation (could last days).
The chat reflects the workflow state in real time.

DESIGN DIRECTION
- Warm, trustworthy, slightly premium. Personal assistant app, not a chatbot.
- Clean sans-serif (NOT Inter — try Geist or a Söhne fallback).
- Warm neutral palette: cream background, soft terracotta accent (#C8623E).
- Subtle animations on send, approve, savings badge.
- Mobile-first. Chat fills viewport on mobile, max-w-2xl centered on desktop.

COMPONENTS NEEDED

1. ChatInterface (main container)
   - Header: "Susi" with small "S" avatar in terracotta circle
   - Status pill: "Online" / "Negotiating" / "Researching"
   - Message list (scrollable, scrollIntoView on new message)
   - Input bar bottom: textarea + send button (terracotta)

2. MessageBubble
   - User: right, neutral grey
   - Susi: left, white card subtle shadow, "S" avatar
   - Timestamps on hover

3. EmailPreview (inline message type)
   - Card inside the chat
   - "Susi drafted this email — review before sending"
   - Email metadata: To, Subject
   - Body in a styled block (mini email client look)
   - Buttons: "Approve & Send" (primary terracotta) and "Edit" (ghost)
   - On approve: success animation, button → "Sent ✓"

4. NegotiationCard
   - Pinned to top of chat when active
   - Title, status badge, current → target price, "Round 3 of 8"
   - Click → detail page

5. WorkflowStatus (NEW — durable workflow indicator)
   - Small horizontal stepper: Researching → Sent → Waiting → Negotiating → Won
   - Current step highlighted in terracotta
   - Subtle pulse on active step
   - "Waiting for vendor reply (timeout in 6d 4h)" when sleeping

6. SavingsBadge
   - Big "$" amount, scale-in animation
   - Subtitle: "from $X to $Y"

7. WelcomeMessage
   - "Hi, I'm Susi. I negotiate on your behalf — by email, in your name. Tell me what you'd like a better price on."

8. QuickStartChips
   - Three pills: "Negotiate my SaaS", "Negotiate a car", "Negotiate rent"
   - Click → pre-fills input

TECH
- Next.js 15 App Router, Tailwind, shadcn/ui
- Vercel AI SDK 5 patterns (useChat hook)
- onClick handlers, no forms unless needed
- Accessible (aria-labels, focus states, keyboard nav)
```

---

## Demo data seed

```typescript
// scripts/seed-demo.ts

// Crea: usuario demo + negociación HubSpot + 3 emails:
//   1. Outbound de Susi pidiendo flexibility
//   2. Inbound del vendedor ofreciendo 15%
//   3. Outbound de Susi pidiendo 30% con argumentos
//
// Estado: negotiating, ready para grabar la última vuelta
// donde el vendedor cierra en $380/mes ($1,440/año ahorro).
//
// Bonus: pre-cargar workflow_events para mostrar timeline en demo.
```

---

## Submission checklist

- [ ] Repo público GitHub con README rico (problema, demo gif, stack, arquitectura, mención al Workflow SDK).
- [ ] Deploy en Vercel funcionando (URL).
- [ ] Video del demo (60-90s) embebido + en YouTube.
- [ ] **El video DEBE mostrar el Vercel Workflow Dashboard con un run en vivo.**
- [ ] OG image custom.
- [ ] Favicon + manifest.
- [ ] Tweet/post taggeando @vercel y @v0.
- [ ] Submission form completado antes del 3 mayo (PT).

---

## Demo script (60-90s)

**Setup:** seed corrido, negociación HubSpot en `negotiating` con 2 emails cruzados, workflow run activo.

1. (0-5s) meetsusi.com → onboarding de Susi → tagline.
2. (5-15s) Escribir: *"I want to negotiate my HubSpot subscription. I'm paying $500/month, renewal next week."*
3. (15-25s) Susi investiga precio → tool call visible.
4. (25-40s) `EmailPreview` → leer en pantalla → click "Approve & Send".
5. (40-50s) **Cut a Vercel Dashboard mostrando el workflow corriendo, sleeping en `waitForVendorReply`.** ★ momento técnico clave.
6. (50-65s) Cut → llega respuesta del vendedor → `WorkflowStatus` se actualiza → Susi propone contra-oferta → aprobar.
7. (65-80s) Resultado: *"I moved the price from $500 to $380/month. You saved $1,440/year."* + `SavingsBadge`.
8. (80-90s) Tagline final: *"Everyone deserves a Susi."*

---

## Roadmap post-hackathon

- Llamadas telefónicas via Bland.ai (otro step del workflow).
- Cobro automático del % del ahorro (Stripe Connect, otro workflow).
- Más categorías + skills.
- Dashboard de ahorros históricos.
- API pública.
- Susi como MCP server.

---

## Cambios respecto a v2

- **Vercel Workflow SDK** integrado al stack como pieza central. La negociación ahora es un workflow durable con `"use workflow"` y `"use step"`.
- **Arquitectura partida** en dominio CHAT (sincrónico, AI SDK) y dominio WORKFLOW (durable, persistente).
- **Webhook entrante simplificado** — solo guarda email + manda signal. La orquestación vive en el workflow.
- **Tools del chat reducidos** — `classify_inbound_reply`, `mark_won`, `mark_lost` ya no son tools; son steps del workflow.
- **Nuevo tool `approve_and_dispatch_email`** — el único que dispara `trigger(runNegotiation, ...)` o `sendSignal`.
- **Schema agrega** `workflow_run_id` y `workflow_status` en `negotiations` + tabla `workflow_events` para observability.
- **Carpeta nueva `lib/workflows/`** con `run-negotiation.ts`, `steps/`, y `signals.ts`.
- **Componente nuevo `WorkflowStatus`** en la UI — stepper visual.
- **FASE 3 reescrita** como "Workflow durable" (antes era email Cloudflare; ahora email es FASE 4).
- **FASE 0 incluye habilitar Workflow SDK.**
- **Demo script incluye toma del Vercel Workflow Dashboard.**
- **Reglas nuevas:** idempotencia de steps, timeouts obligatorios, no APIs no determinísticas en workflow body, `FatalError` para casos no recuperables.
