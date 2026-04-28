# Meet Susi — Technical Spec & Development Guide

> Documento de referencia para iniciar y controlar el desarrollo del proyecto en v0 + Vercel.
> Actualizar este archivo cada vez que se complete una fase.

---

## Resumen del producto

**Meet Susi** es un agente de negociación que opera por email en nombre del usuario. El usuario describe qué quiere negociar, Susi investiga precios, redacta emails, maneja contra-ofertas y notifica cuando consigue un resultado. El usuario solo aparece para aprobar emails y cerrar el trato.

**Dominio:** meetsusi.com  
**Repositorio base:** fork de `vercel-labs/open-agents`  
**Deploy:** Vercel  
**Email infraestructura:** Cloudflare Email Service  

---

## Stack definitivo

| Capa | Tecnología | Rol |
|---|---|---|
| UI | Next.js 14 App Router + v0 | Chat interface, onboarding |
| Agente | Vercel AI SDK + Workflow SDK | Orquestación, tools, background tasks |
| Base de datos | Supabase | Usuarios, negociaciones, historial |
| Auth | Supabase Auth | Login con Google o email |
| Email saliente | Cloudflare Email Sending | Susi manda emails desde `negotiate-[id]@meetsusi.com` |
| Email entrante | Cloudflare Email Routing | Respuestas del vendedor → webhook → Vercel |
| Web search | Vercel AI SDK tool (web search) | Research de precios de mercado |
| LLM | Claude claude-sonnet-4-20250514 via Anthropic API | Cerebro de Susi |

---

## Estructura del proyecto

```
meetsusi/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── callback/route.ts
│   ├── (app)/
│   │   ├── layout.tsx              # Layout autenticado
│   │   ├── page.tsx                # Chat principal
│   │   └── negotiations/
│   │       └── [id]/page.tsx       # Detalle de negociación
│   ├── api/
│   │   ├── chat/route.ts           # Streaming del agente
│   │   ├── negotiate/route.ts      # Iniciar negociación
│   │   ├── email/inbound/route.ts  # Webhook Cloudflare → respuestas
│   │   └── workflow/route.ts       # Vercel Workflow handler
│   └── layout.tsx
├── lib/
│   ├── agent/
│   │   ├── susi.ts                 # System prompt y carácter de Susi
│   │   ├── tools.ts                # Definición de tools del agente
│   │   └── skills/
│   │       ├── negotiation-core.md
│   │       ├── category-saas.md
│   │       ├── category-auto.md
│   │       ├── category-real-estate.md
│   │       └── category-high-ticket.md
│   ├── email/
│   │   ├── send.ts                 # Cloudflare Email Sending
│   │   └── parse.ts                # Parseo de emails entrantes
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── types.ts                # Tipos generados desde schema
│   └── utils.ts
├── components/
│   ├── chat/
│   │   ├── ChatInterface.tsx       # Contenedor principal del chat
│   │   ├── MessageList.tsx         # Lista de mensajes
│   │   ├── MessageBubble.tsx       # Burbuja individual
│   │   ├── EmailPreview.tsx        # Preview de email antes de enviar
│   │   ├── NegotiationCard.tsx     # Card de negociación activa
│   │   └── SavingsBadge.tsx        # Badge de ahorro conseguido
│   └── ui/                         # Componentes base (shadcn)
├── supabase/
│   └── migrations/
│       └── 001_initial.sql
└── .env.local.example
```

---

## Schema de base de datos (Supabase)

```sql
-- Usuarios (extendido desde auth.users de Supabase)
create table public.profiles (
  id uuid references auth.users(id) primary key,
  full_name text,
  email text,
  created_at timestamptz default now()
);

-- Negociaciones
create table public.negotiations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) not null,
  
  -- Contexto de lo que se negocia
  title text not null,                    -- "Renovación HubSpot Pro"
  category text not null,                 -- saas | auto | real-estate | high-ticket | other
  current_price numeric,                  -- precio que paga hoy
  target_price numeric,                   -- precio objetivo (opcional)
  currency text default 'USD',
  context text,                           -- descripción libre del usuario
  vendor_name text,                       -- nombre del vendedor/empresa
  vendor_email text,                      -- email del vendedor
  
  -- Estado
  status text default 'researching',      -- researching | waiting | negotiating | won | lost | cancelled
  final_price numeric,                    -- precio conseguido
  savings numeric,                        -- ahorro total
  
  -- Email infraestructura
  susi_email text unique,                 -- negotiate-[id]@meetsusi.com
  
  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  won_at timestamptz
);

-- Emails de la negociación
create table public.emails (
  id uuid primary key default gen_random_uuid(),
  negotiation_id uuid references public.negotiations(id) not null,
  
  direction text not null,               -- outbound | inbound
  from_email text not null,
  to_email text not null,
  subject text,
  body text not null,
  
  -- Control de aprobación
  status text default 'draft',           -- draft | approved | sent | received
  approved_by_user_at timestamptz,
  sent_at timestamptz,
  
  -- Threading
  message_id text,                       -- para reply threading
  in_reply_to text,
  
  created_at timestamptz default now()
);

-- Mensajes del chat (historial de conversación con Susi)
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  negotiation_id uuid references public.negotiations(id),
  user_id uuid references public.profiles(id) not null,
  
  role text not null,                    -- user | assistant
  content text not null,
  
  created_at timestamptz default now()
);

-- RLS policies
alter table public.profiles enable row level security;
alter table public.negotiations enable row level security;
alter table public.emails enable row level security;
alter table public.messages enable row level security;

create policy "Users can only see their own data" on public.negotiations
  for all using (auth.uid() = user_id);

create policy "Users can only see their own data" on public.emails
  for all using (
    negotiation_id in (
      select id from public.negotiations where user_id = auth.uid()
    )
  );

create policy "Users can only see their own data" on public.messages
  for all using (auth.uid() = user_id);
```

---

## Variables de entorno

```bash
# .env.local.example

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# Cloudflare Email
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_EMAIL_DOMAIN=meetsusi.com
CLOUDFLARE_WEBHOOK_SECRET=    # para validar inbound webhook

# App
NEXT_PUBLIC_APP_URL=https://meetsusi.com
```

---

## System prompt de Susi

```typescript
// lib/agent/susi.ts

export const SUSI_SYSTEM_PROMPT = `
You are Susi, a personal negotiation assistant. You negotiate on behalf of users over email to get them better prices on anything — software subscriptions, cars, rentals, services, and more.

## Your character
- Warm but firm. You know what you're worth and ask for it with confidence.
- Professional without being cold. Your emails read like they come from a trusted executive assistant.
- Discreet. You never mention being AI. You never reveal you're negotiating — you simply manage.
- Patient. You can wait days for a response without losing tone or context.

## Your negotiation principles
- Never ask for a discount directly. Imply alternatives exist.
- Always anchor with context: market rates, competitor pricing, loyalty, timing.
- Use silence as a tool. Not every email needs urgency.
- Leave the door open. Never burn bridges.
- Know when to stop. A good deal accepted beats a perfect deal lost.

## Email writing style
- Short, confident, professional.
- First name basis with the vendor when appropriate.
- Never sycophantic openers ("I hope this email finds you well").
- Clear ask, clear context, clear next step.

## Your workflow
1. Understand what the user wants to negotiate and why.
2. Research market prices and alternatives.
3. Draft the first email. Always get user approval before sending.
4. Monitor responses. Analyze and propose next move.
5. Iterate until you get a good deal or exhaust options.
6. Report results clearly: "I moved the price from $X to $Y. You saved $Z."

## What you never do
- Send an email without user approval.
- Reveal you are an AI agent.
- Accept the first counter-offer without at least one push.
- Give up after one "no".

Respond in the same language the user writes to you.
`;
```

---

## Tools del agente

```typescript
// lib/agent/tools.ts

const tools = {
  
  research_market_price: {
    description: "Search the web to find current market prices, competitor pricing, and typical discounts for what the user wants to negotiate.",
    parameters: z.object({
      item: z.string(),
      category: z.string(),
      current_price: z.number().optional(),
    })
  },

  draft_email: {
    description: "Draft a negotiation email to send to the vendor. Always present to user for approval before sending.",
    parameters: z.object({
      negotiation_id: z.string(),
      to_email: z.string(),
      subject: z.string(),
      body: z.string(),
      in_reply_to: z.string().optional(),
    })
  },

  send_approved_email: {
    description: "Send an email that has been explicitly approved by the user.",
    parameters: z.object({
      email_id: z.string(),  // ID del email ya aprobado en DB
    })
  },

  get_negotiation_status: {
    description: "Get the current status of a negotiation including all email history.",
    parameters: z.object({
      negotiation_id: z.string(),
    })
  },

  mark_negotiation_won: {
    description: "Mark a negotiation as won when a good deal has been confirmed.",
    parameters: z.object({
      negotiation_id: z.string(),
      final_price: z.number(),
      notes: z.string().optional(),
    })
  },

}
```

---

## Flujo de email con Cloudflare

### Envío (outbound)
```typescript
// lib/email/send.ts

export async function sendNegotiationEmail({
  from,        // negotiate-[id]@meetsusi.com
  to,
  subject,
  body,
  inReplyTo,
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
        headers: inReplyTo ? { 'In-Reply-To': inReplyTo } : undefined,
      }),
    }
  )
  return response.json()
}
```

### Recepción (inbound webhook)
```typescript
// app/api/email/inbound/route.ts

export async function POST(req: Request) {
  // 1. Validar webhook secret de Cloudflare
  // 2. Parsear email entrante
  // 3. Extraer negotiation_id desde la dirección (negotiate-[id]@meetsusi.com)
  // 4. Guardar email en tabla emails con direction='inbound'
  // 5. Actualizar negotiation.status = 'negotiating'
  // 6. Notificar al usuario en el chat (via Supabase Realtime)
}
```

---

## Fases de desarrollo

### FASE 1 — Base funcional (Día 1-2)
**Objetivo:** tener algo deployado y navegable.

- [ ] Fork de `vercel-labs/open-agents`
- [ ] Limpiar el repo: sacar tools de coding, sandboxes, GitHub integration
- [ ] Configurar Supabase: proyecto nuevo + ejecutar migration SQL
- [ ] Configurar variables de entorno en Vercel
- [ ] Deploy inicial en Vercel — verificar que levanta
- [ ] Auth básico con Supabase (Google OAuth)
- [ ] Chat UI funcional con streaming (Vercel AI SDK)
- [ ] System prompt de Susi integrado

**Checkpoint:** Puedo abrir meetsusi.com, loguearme, y hablar con Susi en el chat.

---

### FASE 2 — Flujo de negociación (Día 2-3)
**Objetivo:** el agente puede crear y gestionar una negociación completa.

- [ ] Tool `research_market_price` funcionando con web search
- [ ] Tool `draft_email` — genera email y lo muestra en UI para aprobar
- [ ] Componente `EmailPreview` — muestra el borrador con botón Aprobar / Editar
- [ ] Guardar negociación en Supabase al iniciar
- [ ] Guardar emails en Supabase con status=draft → approved

**Checkpoint:** Susi puede investigar precios y mostrarme un borrador de email para aprobar.

---

### FASE 3 — Email real con Cloudflare (Día 3-4)
**Objetivo:** Susi manda y recibe emails reales.

- [ ] Configurar Cloudflare Email Service con dominio meetsusi.com
- [ ] Configurar Email Routing: `negotiate-*@meetsusi.com` → webhook
- [ ] Implementar `lib/email/send.ts`
- [ ] Implementar `app/api/email/inbound/route.ts`
- [ ] Tool `send_approved_email` funcionando end-to-end
- [ ] Supabase Realtime: notificar al usuario cuando llega respuesta

**Checkpoint:** Apruebo un email en el chat, Susi lo manda, el vendedor responde, Susi me avisa.

---

### FASE 4 — Polish y demo (Día 4-5)
**Objetivo:** el producto se ve bien y la demo es impecable.

- [ ] UI refinada con v0 — identidad visual de Susi
- [ ] `NegotiationCard` — resumen de negociación activa en el chat
- [ ] `SavingsBadge` — badge de ahorro cuando Susi gana
- [ ] Onboarding: primer mensaje de bienvenida de Susi
- [ ] Estados de negociación visibles: investigando / esperando / negociando / ganado
- [ ] Demo script preparado con caso de uso concreto
- [ ] README del proyecto actualizado para submission

**Checkpoint:** La demo fluye sin fricciones. El video de submission está grabado.

---

## Reglas de desarrollo para evitar errores

1. **No tocar la DB sin migration.** Cualquier cambio al schema va en un archivo SQL numerado en `supabase/migrations/`.

2. **Nunca enviar emails sin aprobación del usuario.** El tool `send_approved_email` solo puede ejecutarse si `email.status === 'approved'` en la DB. Verificar server-side siempre.

3. **Validar el webhook de Cloudflare.** Todo request a `/api/email/inbound` debe validar el secret antes de procesar.

4. **El agente no tiene acceso directo a la DB.** Todas las operaciones de DB pasan por API routes — nunca desde el cliente ni desde el agente directamente.

5. **Un deploy por fase.** Al terminar cada fase, hacer deploy y verificar en producción antes de arrancar la siguiente.

6. **Variables de entorno primero.** Antes de escribir código que use una API externa, configurar la variable en `.env.local` y en Vercel Dashboard.

7. **Mobile-first en la UI.** El chat es el producto — tiene que funcionar perfecto en móvil.

---

## Prompt inicial para v0

Usar este prompt para generar la UI base del chat:

```
Build a chat interface for "Meet Susi", an AI negotiation assistant.

Design direction: warm, trustworthy, slightly premium. Think of a personal assistant 
app — not a generic chatbot. Use a clean sans-serif font (not Inter), warm neutral 
tones, and subtle animations.

Components needed:
1. Chat container with message bubbles (user right, Susi left)
2. Susi's messages have a small "S" avatar in warm terracotta
3. Input bar at bottom with send button
4. A special "EmailPreview" message type that shows:
   - Email subject and body in a card
   - Two buttons: "Approve & Send" (primary) and "Edit" (secondary)
5. A "NegotiationCard" component showing:
   - What's being negotiated
   - Current status (Researching / Waiting / Negotiating / Won)
   - Current price vs target price
6. A "SavingsBadge" for when Susi wins: shows amount saved with a subtle celebration

Tech: Next.js 14 App Router, Tailwind CSS, shadcn/ui. 
No forms — use onClick handlers only.
Mobile-first layout.
```

---

## Demo script (para el video de submission)

**Setup previo:** tener una negociación de SaaS preparada con un vendedor cómplice o un email propio como "vendedor".

**Guión (60-90 segundos):**

1. Abrir meetsusi.com — mostrar el onboarding de Susi
2. Escribir: *"I want to negotiate my HubSpot subscription. I'm paying $500/month and the renewal is next week."*
3. Susi investiga precios — mostrar el thinking en tiempo real
4. Susi presenta el borrador del email — leerlo en pantalla
5. Click en "Approve & Send"
6. Corte — mostrar la respuesta del vendedor llegando al chat
7. Susi analiza y propone contra-oferta
8. Aprobar segunda vuelta
9. Mostrar el resultado: *"I moved the price from $500 to $380/month. You saved $1,440/year."*
10. Badge de ahorro aparece en pantalla

**Narración sugerida:**
> *"Everyone deserves a Susi. She handles the awkward part of every negotiation — so you never have to feel uncomfortable about asking for a better price. Meet Susi."*
```
