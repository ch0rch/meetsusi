# Meet Susi — Technical Spec v2

> Documento de referencia para v0.app + Vercel. Versión mejorada del spec original con foco en hackathon entregable.
> Actualizar cada vez que se complete una fase.

---

## TL;DR

**Producto:** Agente de negociación por email. El usuario describe qué quiere negociar, Susi investiga, redacta, manda emails desde su propio dominio, maneja contra-ofertas y notifica cuando consigue un descuento.

**Hackathon:** Vercel "Zero to Agent" — submission window 24 abril → 3 mayo 2026 (PT). Voting 4 mayo.

**Stack base:** Next.js 14 App Router + Vercel AI SDK 5 + Supabase + Cloudflare Email + Claude Sonnet 4.6.

**Modelo de cobro:** gain-sharing — Susi cobra solo cuando el usuario ahorra (post-MVP).

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
| Agente | Vercel AI SDK | 5.x | streamText, tools, generateObject |
| Background tasks | Vercel Workflow / Cron | Latest | Seguimiento de negociaciones, retries |
| LLM | Claude Sonnet via Anthropic | `claude-sonnet-4-6` | Cerebro de Susi |
| LLM Gateway (opcional) | Vercel AI Gateway | Latest | Observability + sin lock-in |
| Web search | AI SDK tool | `tavily` o `exa` | Research de precios |
| Base de datos | Supabase Postgres | Latest | Negociaciones, emails, mensajes |
| Auth | Supabase Auth | Latest | Google OAuth + magic link |
| Realtime | Supabase Realtime | Latest | Notificar respuestas del vendedor en chat |
| Email saliente | Cloudflare Email Sending | API v4 | `negotiate-[id]@meetsusi.com` |
| Email entrante | Cloudflare Email Routing | Workers | Webhook → Vercel |
| Storage (opcional) | Vercel Blob | Latest | Facturas/contratos subidos |

> **Nota sobre el modelo:** El spec original mencionaba `claude-sonnet-4-20250514`. A abril 2026 el modelo más reciente y costo/performance es `claude-sonnet-4-6`. Usar ese.

---

## Arquitectura general

```
┌────────────────────────────────────────────────────────────────┐
│                         meetsusi.com                           │
│                                                                │
│   ┌────────────┐      ┌─────────────────┐    ┌────────────┐    │
│   │  Chat UI   │◄────►│  /api/chat      │◄──►│  Claude    │    │
│   │  (Next.js) │      │  (AI SDK)       │    │  Sonnet    │    │
│   └────────────┘      └────────┬────────┘    └────────────┘    │
│         ▲                      │                               │
│         │ Realtime              │ tools                        │
│         │                       ▼                              │
│   ┌─────┴────────┐      ┌─────────────────┐                    │
│   │   Supabase   │◄─────┤  research/draft │                    │
│   │  (Postgres)  │      │  send/status    │                    │
│   └──────────────┘      └────────┬────────┘                    │
│                                  │                             │
└──────────────────────────────────┼─────────────────────────────┘
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
                                          (webhook)
```

**Flujo end-to-end:**
1. Usuario escribe a Susi en el chat (streaming).
2. Susi llama `research_market_price` (web search).
3. Susi llama `draft_email` → guarda email con `status='draft'`.
4. UI muestra `EmailPreview` con botón "Approve & Send".
5. Usuario aprueba → `status='approved'` → `send_approved_email` → Cloudflare envía.
6. Vendedor responde → llega a `negotiate-[id]@meetsusi.com` → Cloudflare Routing → webhook.
7. Webhook valida HMAC, parsea, guarda en `emails` con `direction='inbound'`.
8. Supabase Realtime notifica al chat del usuario.
9. Susi analiza la respuesta y propone próximo movimiento.
10. Repetir hasta cerrar trato.

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
│   │       ├── page.tsx                # Lista de negociaciones
│   │       └── [id]/page.tsx           # Detalle (timeline + emails)
│   ├── api/
│   │   ├── chat/route.ts               # Streaming del agente
│   │   ├── negotiate/route.ts          # Iniciar negociación (server action alt)
│   │   ├── email/inbound/route.ts      # Webhook Cloudflare
│   │   └── workflow/route.ts           # Vercel Workflow handler
│   └── layout.tsx
├── lib/
│   ├── agent/
│   │   ├── susi.ts                     # System prompt + persona
│   │   ├── tools.ts                    # Definición de tools
│   │   └── skills/                     # Markdown skills cargados al prompt
│   │       ├── negotiation-core.md
│   │       ├── category-saas.md
│   │       ├── category-auto.md
│   │       ├── category-real-estate.md
│   │       └── category-high-ticket.md
│   ├── email/
│   │   ├── send.ts                     # Cloudflare Email Sending
│   │   ├── parse.ts                    # Parseo emails entrantes
│   │   ├── threading.ts                # Message-ID, In-Reply-To, References
│   │   └── classify.ts                 # OOO, bounce, real reply
│   ├── supabase/
│   │   ├── client.ts                   # browser client
│   │   ├── server.ts                   # server client (RSC + route handlers)
│   │   ├── service.ts                  # service role (webhooks)
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
│   │   ├── NegotiationCard.tsx         # Estado de negociación
│   │   └── SavingsBadge.tsx
│   ├── onboarding/
│   │   ├── WelcomeMessage.tsx
│   │   └── QuickStartChips.tsx         # "Negotiate SaaS", "Negotiate car"
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

  -- Límites de seguridad
  max_rounds int default 8,                  -- evita loops infinitos
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
  message_id text unique,                    -- propio (outbound) o externo (inbound)
  in_reply_to text,                          -- Message-ID al que responde
  email_references text[],                   -- Cadena completa para threading

  -- Idempotencia (webhooks pueden duplicar)
  external_id text unique,                   -- ID provisto por Cloudflare

  -- Clasificación de inbound
  is_auto_reply boolean default false,       -- OOO, autoresponder
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
  tool_calls jsonb,                          -- AI SDK message.parts compatibility

  created_at timestamptz default now()
);

-- Cache de research por item (evita re-buscar precios iguales)
create table public.market_research_cache (
  id uuid primary key default gen_random_uuid(),
  cache_key text unique not null,            -- hash(item + category)
  result jsonb not null,
  created_at timestamptz default now(),
  expires_at timestamptz default now() + interval '24 hours'
);
```

### Migration `002_indexes.sql`

```sql
-- Lookups frecuentes
create index idx_negotiations_user on public.negotiations(user_id, created_at desc);
create index idx_negotiations_status on public.negotiations(status) where status not in ('won', 'lost', 'cancelled');
create index idx_negotiations_susi_email on public.negotiations(susi_email);

create index idx_emails_negotiation on public.emails(negotiation_id, created_at desc);
create index idx_emails_status_pending on public.emails(status) where status in ('pending_approval', 'approved');
create index idx_emails_message_id on public.emails(message_id) where message_id is not null;
create index idx_emails_external_id on public.emails(external_id) where external_id is not null;

create index idx_messages_negotiation on public.messages(negotiation_id, created_at);
create index idx_market_cache_expires on public.market_research_cache(expires_at);

-- Trigger para updated_at en negotiations
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
-- RLS
alter table public.profiles enable row level security;
alter table public.negotiations enable row level security;
alter table public.emails enable row level security;
alter table public.messages enable row level security;

-- Policies
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

-- Realtime publication
alter publication supabase_realtime add table public.negotiations;
alter publication supabase_realtime add table public.emails;
alter publication supabase_realtime add table public.messages;
```

---

## Variables de entorno

```bash
# .env.local.example

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=                # solo en server / webhooks

# Anthropic
ANTHROPIC_API_KEY=

# Vercel AI Gateway (opcional pero recomendado)
AI_GATEWAY_API_KEY=

# Web search (uno de los dos)
TAVILY_API_KEY=
# EXA_API_KEY=

# Cloudflare Email
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_EMAIL_DOMAIN=meetsusi.com
CLOUDFLARE_WEBHOOK_SECRET=                # validación HMAC inbound

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
- You are warm, firm, professional, and discreet.
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

# Workflow
1. UNDERSTAND: ask what they want to negotiate, current price, vendor, deadline if any.
2. RESEARCH: call research_market_price to get market context.
3. DRAFT: call draft_email. ALWAYS get user approval before sending.
4. WAIT: explain to the user that you'll notify them when the vendor replies.
5. ANALYZE: when a reply comes, classify it (open / hard-no / counter-offer / qualifying-question) and propose next move.
6. ITERATE: max 8 rounds. Stop earlier if you hit a clear ZOPA.
7. CLOSE: when a deal is good, mark_negotiation_won and report: "I moved the price from $X to $Y. You saved $Z."

# Hard rules
- NEVER call send_approved_email unless the user explicitly clicked "Approve & Send" in the UI (status='approved' in DB).
- NEVER fabricate quotes, prices, or data you don't have.
- NEVER promise on behalf of the user (signing, paying, committing).
- If the vendor asks for a decision you don't have authority over, surface it to the user.
`;
```

---

## Tools del agente

```typescript
// lib/agent/tools.ts
import { tool } from 'ai';
import { z } from 'zod';

export const tools = {

  research_market_price: tool({
    description: 'Search the web for current market prices, competitor pricing, and typical discounts. Cached 24h per item+category.',
    parameters: z.object({
      item: z.string().describe('Specific product or service name'),
      category: z.enum(['saas', 'auto', 'real_estate', 'high_ticket', 'other']),
      current_price: z.number().optional(),
      currency: z.string().default('USD'),
    }),
    execute: async (args) => { /* ... */ },
  }),

  start_negotiation: tool({
    description: 'Create a new negotiation record once the user has provided enough context.',
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
    description: 'Draft a negotiation email. Saved as status=pending_approval. ALWAYS shown to user for approval before sending.',
    parameters: z.object({
      negotiation_id: z.string().uuid(),
      to_email: z.string().email(),
      subject: z.string(),
      body: z.string(),
      in_reply_to_email_id: z.string().uuid().optional(),
    }),
    execute: async (args) => { /* returns { email_id } */ },
  }),

  send_approved_email: tool({
    description: 'Send an email that has been explicitly approved by the user. Will fail if email.status !== "approved".',
    parameters: z.object({
      email_id: z.string().uuid(),
    }),
    execute: async (args) => { /* validates status server-side */ },
  }),

  get_negotiation_status: tool({
    description: 'Get current status, all emails, and remaining rounds for a negotiation.',
    parameters: z.object({
      negotiation_id: z.string().uuid(),
    }),
    execute: async (args) => { /* ... */ },
  }),

  classify_inbound_reply: tool({
    description: 'Classify a vendor reply: open, hard_no, counter_offer, qualifying_question, ooo, bounce.',
    parameters: z.object({
      email_id: z.string().uuid(),
    }),
    execute: async (args) => { /* ... */ },
  }),

  mark_negotiation_won: tool({
    description: 'Mark a negotiation as won when a good deal is confirmed by the vendor.',
    parameters: z.object({
      negotiation_id: z.string().uuid(),
      final_price: z.number(),
      notes: z.string().optional(),
    }),
    execute: async (args) => { /* ... */ },
  }),

  cancel_negotiation: tool({
    description: 'Cancel a negotiation when the user decides to walk away or the deal is dead.',
    parameters: z.object({
      negotiation_id: z.string().uuid(),
      reason: z.string(),
    }),
    execute: async (args) => { /* ... */ },
  }),
};
```

---

## Email threading correcto (RFC 5322)

Esto es crítico para que el thread del vendedor mantenga continuidad en su cliente de email.

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
  // Message-ID estable y único
  const messageId = `<${randomUUID()}@meetsusi.com>`;

  const headers: Record<string, string> = {
    'Message-ID': messageId,
    'X-Negotiation-Id': negotiationId,
  };

  if (inReplyToMessageId) {
    headers['In-Reply-To'] = inReplyToMessageId;
    // References debe incluir el thread completo + el In-Reply-To
    headers['References'] = [...references, inReplyToMessageId].join(' ');
  }

  return { messageId, headers };
}
```

**Reglas:**
- `Message-ID` siempre con formato `<uuid@meetsusi.com>`.
- `In-Reply-To` sin corchetes adicionales — usar el valor tal como vino del vendedor.
- `References` se acumula a lo largo del thread.
- Subject: prefijar `Re:` si está respondiendo.

---

## Flujo de email con Cloudflare

### Envío (outbound)

```typescript
// lib/email/send.ts

export async function sendNegotiationEmail({
  from,                    // Susi <negotiate-[id]@meetsusi.com>
  to,
  subject,
  body,
  messageId,
  inReplyTo,
  references,
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
        from,
        to,
        subject,
        text: body,
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

### Recepción (inbound webhook)

```typescript
// app/api/email/inbound/route.ts

import { verifyHmac } from '@/lib/security/hmac';
import { classifyInboundEmail } from '@/lib/email/classify';
import { extractNegotiationId } from '@/lib/email/parse';
import { serviceSupabase } from '@/lib/supabase/service';

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-cloudflare-signature');

  // 1. Validar HMAC timing-safe
  if (!signature || !verifyHmac(rawBody, signature, process.env.CLOUDFLARE_WEBHOOK_SECRET!)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const payload = JSON.parse(rawBody);

  // 2. Idempotencia — Cloudflare puede reentregar
  const { data: existing } = await serviceSupabase
    .from('emails')
    .select('id')
    .eq('external_id', payload.id)
    .maybeSingle();
  if (existing) return Response.json({ ok: true, deduped: true });

  // 3. Extraer negotiation_id desde la dirección destino
  const negotiationId = extractNegotiationId(payload.to);
  if (!negotiationId) return new Response('Invalid recipient', { status: 400 });

  // 4. Validar que la negociación existe y NO está cerrada
  const { data: neg } = await serviceSupabase
    .from('negotiations')
    .select('id, status, vendor_email, max_rounds, rounds_completed')
    .eq('id', negotiationId)
    .single();
  if (!neg || ['won', 'lost', 'cancelled'].includes(neg.status)) {
    return Response.json({ ok: true, ignored: true });
  }

  // 5. Clasificar (OOO / bounce / real)
  const classification = classifyInboundEmail(payload);

  // 6. Insertar email
  await serviceSupabase.from('emails').insert({
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
  });

  // 7. Si es real reply, actualizar status y disparar workflow del agente
  if (!classification.isAutoReply && !classification.isBounce) {
    await serviceSupabase
      .from('negotiations')
      .update({ status: 'negotiating' })
      .eq('id', negotiationId);
    // El cliente recibe la actualización via Supabase Realtime
    // El agente la procesará en la próxima vuelta del chat
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

### Reglas de seguridad
1. **Service role key NUNCA en el cliente.** Solo en route handlers y webhooks.
2. **El agente NUNCA escribe directo a la DB.** Toda operación pasa por tools server-side.
3. **`send_approved_email` valida server-side** que `email.status === 'approved'`. Sin excepciones.
4. **Sanitizar HTML/texto** del email entrante antes de mostrarlo en la UI (DOMPurify si renderizan HTML).
5. **Rate limit** del webhook por IP + por dirección destino.
6. **CORS estricto** en `/api/*`. El webhook acepta solo POST sin CORS.
7. **RLS activo en todas las tablas.** Verificar en producción que las queries fallan sin auth.

---

## Realtime y notificaciones

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
        // Disparar análisis del agente
        appendAssistantTrigger(`vendor_replied:${email.id}`);
      }
    })
    .subscribe();

  return () => { channel.unsubscribe(); };
}, [negotiationId]);
```

---

## Edge cases del email

| Caso | Detección | Acción |
|---|---|---|
| Out-of-office | Headers `auto-submitted`, subject "Out of Office", body con keywords | Marcar `is_auto_reply=true`, no procesar, no avisar al user |
| Bounce | `from` contiene `mailer-daemon`, `postmaster`, status code 5xx | Marcar `is_bounce=true`, status `lost`, avisar al user |
| Forwarded chain | Body con `>>>` o "Forwarded message" | Truncar a primer mensaje antes de pasar al LLM |
| Email muy largo | > 10k chars | Truncar a 8k y agregar nota al LLM |
| Sender ≠ vendor_email esperado | `from` no matchea `vendor_email` | Procesar igual pero log warning (puede ser CC del vendedor) |
| Loop de respuestas | `rounds_completed >= max_rounds` | Marcar `lost`, avisar al user |

---

## Observability mínima

- **Vercel Analytics** activado.
- **Logs estructurados** en JSON (`console.log(JSON.stringify({ event, data }))`).
- **Tabla de events** opcional (`audit_log`) si hay tiempo.
- **Página interna `/negotiations/[id]`** con timeline completo + emails crudos para debug durante demo.
- **Vercel AI Gateway** si lo activan, da observability de llamadas al LLM out-of-the-box.

---

## Performance y costo

- **Cache de research** 24h por `hash(item + category)`. Evita re-pagar tokens y queries de search.
- **Límite de 8 rounds** por negociación. Configurable por user post-MVP.
- **Streaming agresivo** en chat. Nunca esperar respuesta completa para empezar a renderizar.
- **`generateObject` en lugar de `streamText`** para classify_inbound_reply (más predecible, más barato).

---

## Fases de desarrollo

### FASE 0 — Setup (medio día)

- [ ] Fork de `vercel-labs/open-agents` en GitHub.
- [ ] Clone local + limpiar (sacar coding tools, sandboxes, GitHub integration).
- [ ] Crear proyecto Supabase + ejecutar migrations 001/002/003.
- [ ] Configurar Cloudflare: dominio meetsusi.com + Email Routing + DNS records (MX, SPF, DKIM, DMARC).
- [ ] Crear proyecto Vercel + import del repo + variables de entorno.
- [ ] Deploy inicial (verificar que levanta).
- [ ] v0.app: conectar al repo para iterar UI.

**Checkpoint:** meetsusi.com responde 200, `/api/health` ok.

---

### FASE 1 — Base funcional (Día 1-2)

- [ ] Auth con Supabase (Google OAuth + magic link).
- [ ] Layout autenticado + redirección.
- [ ] Chat UI básico con `useChat` de AI SDK 5.
- [ ] System prompt de Susi integrado.
- [ ] Skills cargados desde `lib/agent/skills/*.md`.
- [ ] Streaming funcional.

**Checkpoint:** Login, chat con Susi, ella responde en personaje.

---

### FASE 2 — Flujo de negociación (Día 2-3)

- [ ] Tool `research_market_price` con cache.
- [ ] Tool `start_negotiation` (crea record, asigna `susi_email`).
- [ ] Tool `draft_email` → guarda con `pending_approval`.
- [ ] Componente `EmailPreview` con Approve/Edit.
- [ ] Tool `send_approved_email` (sin enviar todavía — mock).

**Checkpoint:** Susi investiga, propone email, lo veo en UI con botón aprobar.

---

### FASE 3 — Email real con Cloudflare (Día 3-4)

- [ ] `lib/email/send.ts` con threading correcto.
- [ ] Cloudflare Email Routing → `/api/email/inbound`.
- [ ] HMAC validation + idempotencia.
- [ ] Clasificación OOO/bounce.
- [ ] Supabase Realtime en chat.
- [ ] Tool `classify_inbound_reply`.

**Checkpoint:** Apruebo email → sale → vendedor responde → llega al chat → Susi analiza y propone próximo movimiento.

---

### FASE 4 — Polish + demo (Día 4-5)

- [ ] UI refinada con v0 — paleta warm terracotta, "S" avatar.
- [ ] `NegotiationCard` + `SavingsBadge`.
- [ ] Onboarding con `WelcomeMessage` + `QuickStartChips`.
- [ ] Estados visibles: investigando / esperando / negociando / ganado.
- [ ] Mobile-first verificado.
- [ ] Seed script para grabar el demo (`scripts/seed-demo.ts`).
- [ ] Video del demo grabado.
- [ ] README listo + OG image + favicon.
- [ ] Deploy final + smoke test end-to-end.

**Checkpoint:** Demo fluye sin fricciones, video grabado, submission lista.

---

## Reglas de desarrollo

1. **No tocar la DB sin migration.** Cualquier cambio va en `supabase/migrations/NNN_*.sql`.
2. **Nunca enviar emails sin aprobación.** `send_approved_email` valida `status='approved'` server-side. Sin excepciones.
3. **Validar el webhook siempre.** Sin HMAC válido, 401.
4. **El agente no toca la DB directo.** Solo via tools.
5. **Service role key nunca en cliente.** Solo en route handlers y webhooks.
6. **Un deploy por fase.** Verificar en producción antes de la siguiente.
7. **Variables de entorno primero.** Configurar `.env.local` + Vercel Dashboard antes de escribir el código que las usa.
8. **Mobile-first.** El chat tiene que volar en móvil.
9. **Threading correcto.** `Message-ID` único, `In-Reply-To`, `References` acumuladas.
10. **Logs JSON.** Todo `console.log` con shape `{ event, ...data }`.

---

## Prompt inicial para v0.app

```
Build a chat interface for "Meet Susi", an AI negotiation assistant.

CONTEXT
Susi negotiates by email on behalf of users to get them better prices on
SaaS, cars, rentals, services. The chat is the primary interface — users
talk to Susi, she researches prices, drafts emails, asks for approval,
and reports back when she wins.

DESIGN DIRECTION
- Warm, trustworthy, slightly premium. Personal assistant app, not a chatbot.
- Clean sans-serif (NOT Inter — try Geist or Söhne fallback).
- Warm neutral palette: cream background, soft terracotta accent (#C8623E).
- Subtle animations on send, approve, savings badge.
- Mobile-first. Chat fills viewport on mobile, max-w-2xl centered on desktop.

COMPONENTS NEEDED

1. ChatInterface (main container)
   - Header: "Susi" with small "S" avatar in terracotta circle
   - Status pill below name: "Online" / "Negotiating" / "Researching"
   - Message list (scrollable, scrollIntoView on new message)
   - Input bar bottom: textarea + send button (terracotta)

2. MessageBubble
   - User messages: right-aligned, neutral grey background
   - Susi messages: left-aligned, white card with subtle shadow
   - Susi messages have small "S" avatar
   - Timestamps on hover only

3. EmailPreview (special message type)
   - Shown inline as a card inside the chat
   - Header: "Susi drafted this email — review before sending"
   - Email metadata: To, Subject
   - Body in monospace-ish styled block (like a mini email client)
   - Two buttons: "Approve & Send" (primary terracotta) and "Edit" (ghost)
   - On approve: subtle success animation, button transforms to "Sent ✓"

4. NegotiationCard
   - Compact card pinned to top of chat when negotiation is active
   - Title: what's being negotiated
   - Status badge: Researching / Awaiting Approval / Sent / Negotiating / Won
   - Current price → Target price (with arrow)
   - Rounds: "3 of 8"
   - Click to open detail page

5. SavingsBadge
   - Appears when Susi marks a negotiation as won
   - Big "$" amount with subtle confetti or scale-in animation
   - Subtitle: "from $X to $Y"

6. WelcomeMessage (first message from Susi)
   - "Hi, I'm Susi. I negotiate on your behalf — by email, in your name. Tell me what you'd like a better price on."

7. QuickStartChips (below welcome message)
   - Three pills: "Negotiate my SaaS", "Negotiate a car", "Negotiate rent"
   - Click → pre-fills input

TECH
- Next.js 15 App Router, Tailwind, shadcn/ui
- Use Vercel AI SDK 5 patterns (useChat hook)
- All onClick handlers — no forms unless strictly needed
- All accessible (aria-labels, focus states, keyboard nav)
```

---

## Demo data seed

```typescript
// scripts/seed-demo.ts

// Crea un usuario demo + negociación con HubSpot + 3 emails:
// 1. Outbound de Susi pidiendo flexibility
// 2. Inbound del vendedor ofreciendo 15%
// 3. Outbound de Susi pidiendo 30% con argumentos
//
// Estado final: negotiating, listo para grabar la última vuelta donde
// el vendedor cierra en $380/mes ($1,440/año ahorro).
```

Tener este seed permite grabar el video sin depender de respuestas reales del "vendedor".

---

## Submission checklist (no se ignora)

- [ ] Repo público en GitHub con README rico (problema, demo gif, stack, arquitectura).
- [ ] Deploy en Vercel funcionando (URL: meetsusi.com o vercel.app).
- [ ] Video del demo (60-90s) embebido en README + subido a YouTube.
- [ ] OG image custom para sharing.
- [ ] Favicon + manifest.json para PWA-like en móvil.
- [ ] Tweet/post taggeando @vercel y @v0 con link al deploy.
- [ ] Submission form de Vercel completado antes del 3 mayo (PT).

---

## Demo script (60-90s)

**Setup previo:** seed corrido, una negociación HubSpot lista en estado `negotiating` con 2 emails ya cruzados.

1. (0-5s) Abrir meetsusi.com → onboarding de Susi → tagline.
2. (5-15s) Escribir: *"I want to negotiate my HubSpot subscription. I'm paying $500/month, renewal next week."*
3. (15-25s) Mostrar a Susi investigando precio → tool call `research_market_price` con thinking visible.
4. (25-40s) Aparece `EmailPreview` con el borrador → leer en pantalla → click "Approve & Send".
5. (40-55s) Cut → llega respuesta del vendedor al chat (Realtime) → Susi propone contra-oferta → aprobar segunda vuelta.
6. (55-80s) Resultado: *"I moved the price from $500 to $380/month. You saved $1,440/year."* + `SavingsBadge` aparece.
7. (80-90s) Tagline final: *"Everyone deserves a Susi."*

---

## Roadmap post-hackathon

- Llamadas telefónicas via Bland.ai.
- Cobro automático del % del ahorro (Stripe Connect).
- Más categorías + skills especializados.
- Dashboard de ahorros históricos + analytics.
- API pública para integración con CRMs.
- Susi como MCP server (que otros agentes puedan delegarle negociaciones).

---

## Cambios respecto a v1

- **Modelo:** `claude-sonnet-4-20250514` → `claude-sonnet-4-6` (más reciente, mejor costo/calidad a abril 2026).
- **Migrations separadas** en 3 archivos numerados (initial / indexes / realtime).
- **Schema:** enums tipados, `savings` como columna generada, `max_rounds`, `external_id` para idempotencia, threading completo (`message_id`, `in_reply_to`, `email_references`).
- **Cache de research** explícito como tabla.
- **Sección de seguridad** dedicada (HMAC, RLS, sanitización).
- **Sección de threading** dedicada (RFC 5322).
- **Sección de edge cases** del email (OOO, bounces, forwarded chains).
- **Tools nuevos:** `start_negotiation`, `classify_inbound_reply`, `cancel_negotiation`.
- **Status enum más rico** (`awaiting_approval`, `waiting_reply`, `negotiating`).
- **Submission checklist** explícito.
- **FASE 0** separada de FASE 1 (setup vs feature work).
