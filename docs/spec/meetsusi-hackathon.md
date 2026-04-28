# Meet Susi — Vercel Zero to Agent Hackathon

**Dominio:** meetsusi.com  
**Tagline:** *"Everyone deserves a Susi."*

---

## Quién es Susi

Susi es un agente de negociación personal que trabaja por email en tu nombre. Investiga precios, redacta mensajes, maneja contra-ofertas y solo te interrumpe cuando consiguió algo bueno.

El nombre viene de Susana — una persona real, querida, que sabía cómo pedir las cosas con gracia y firmeza. Eso es exactamente lo que Susi hace por vos.

---

## El carácter de Susi

**Susi es:**
- Cálida pero firme. No agresiva, no sumisa — sabe lo que vale y lo pide con confianza
- Profesional sin ser fría. Sus emails suenan a asistente ejecutiva de alguien importante
- Discreta. Nunca menciona que es IA, nunca revela que está negociando — simplemente gestiona
- Paciente. Puede esperar días una respuesta sin perder el hilo ni el tono

**Susi no es:**
- Un bot obvio
- Agresiva ni confrontacional
- Genérica — tiene voz propia

### Cómo escribe Susi

Nunca dice "quiero descuento". Siempre implica que hay alternativas. Siempre deja la puerta abierta:

> *"Hi [nombre], I'm reaching out on behalf of [usuario]. They've been using [producto] and are looking to continue, but need to make the numbers work for this cycle. Is there any flexibility on the current pricing before we finalize a decision?"*

---

## El producto en una frase

> *"Susi is the negotiation assistant everyone deserves but almost nobody has. She handles the awkward part — the asking — so you never have to feel uncomfortable about getting a better price."*

---

## El problema

**Los vendedores siempre tienen un precio que no te van a ofrecer voluntariamente.**

No es malicia — es cómo funciona cualquier negocio. El precio de lista maximiza el margen. El descuento existe para cuando el comprador lo necesita, pero solo aparece si alguien lo pide de la manera correcta.

El problema no es que la gente no quiera negociar. Es que:
- **Da vergüenza** — culturalmente pedir descuento se siente agresivo o desesperado
- **No saben cómo** — negociar bien es una habilidad que lleva años desarrollar
- **No tienen tiempo** — requiere investigación, redacción, seguimiento
- **Miedo de arruinar la relación** — especialmente en compras grandes

Susi elimina los cuatro problemas a la vez.

---

## La solución

Susi negocia por email en tu nombre. Vos le decís qué querés comprar y cuánto estás pagando. Ella investiga, redacta, manda emails, maneja contra-ofertas — y solo te interrumpe cuando consiguió algo bueno.

**Aplica a cualquier cosa que se pueda negociar por email:**
- Software / SaaS (renovaciones, nuevos contratos)
- Autos
- Alquileres y propiedades
- Seguros
- Servicios de agencias
- Productos de alto valor
- Proveedores y suministros

---

## El insight de negociación: ZOPA

**ZOPA** — Zone of Possible Agreement. Existe en casi toda transacción. La mayoría de los compradores nunca la exploran.

Los vendedores tienen descuentos pre-aprobados que usan solo cuando es necesario. Es un as bajo la manga disponible — pero solo aparece si alguien lo pide de la manera correcta, en el momento correcto, con los argumentos correctos.

---

## Los números que cuentan la historia

**Autos**
El precio de lista tiene entre 8% y 15% de margen negociable. En un auto de $30,000 son entre $2,400 y $4,500 sobre la mesa. La mayoría no negocia nada porque no sabe cómo empezar.

**Software / SaaS**
Las empresas tech tienen descuentos pre-aprobados de hasta 30-40% para retención y cierre de fin de trimestre. HubSpot, Salesforce, Adobe — todos tienen ese margen. Casi ningún usuario individual lo pide.

**Alquileres**
En mercados con alta oferta, entre 5% y 10% del precio inicial es negociable. En un alquiler de $2,000/mes, son $2,400/año que la mayoría deja ir porque "no se hace".

**El número grande**
Una persona promedio toma entre 3 y 5 decisiones de compra de alto valor por año donde existe margen negociable. Si en cada una deja el 10% sobre la mesa, en 10 años son decenas de miles de dólares evaporados — no por falta de dinero disponible del vendedor, sino por falta de quien pregunte.

---

## Modelo de negocio

**Gain-sharing:** Susi solo cobra cuando el usuario ahorra.

Un porcentaje del ahorro conseguido, calculado sobre base anualizada cuando aplica. El usuario no paga nada si Susi no logra ningún descuento.

Alineación total de incentivos: Susi gana cuando vos ganás.

---

## Estructura del pitch (60 segundos)

**1. El problema (10 seg)**
> *"Every price you've ever paid had a lower version. You just never asked."*

**2. La causa (10 seg)**
> *"Not because you're bad at negotiating. Because negotiating is uncomfortable, slow, and most people don't know where to start."*

**3. La solución (10 seg)**
> *"Meet Susi. An AI agent that negotiates for you over email. You tell her what you want to buy and what you're paying. She does the rest — research, outreach, counter-offers — and only comes back to you when she wins."*

**4. El modelo (5 seg)**
> *"Susi only gets paid when you save money."*

**5. El cierre emocional**
> *"The seller already has a better price ready. They're just waiting for someone to ask. Now someone will. Her name is Susi."*

---

## El ángulo para la comunidad dev

La audiencia del hackathon de Vercel es developers y founders. Ese perfil paga SaaS todos los meses y entiende que los precios son construcciones sociales, no verdades absolutas.

El mensaje que más resuena:
> *"That SaaS tool you've been paying full price for? They would have given you 30% off if someone asked right. Susi asks right."*

---

## Stack técnico

```
Base: Fork de vercel-labs/open-agents
├── Next.js (App Router) — chat UI + streaming
├── Vercel Workflow SDK — ejecución durable en background
├── Cloudflare Email Service — envío y recepción de emails (plan B > Gmail MCP)
├── Web search tool — investigación de precios de mercado
├── Claude API (Vercel AI SDK) — agente negociador
├── Supabase — persistencia de negociaciones y estado
└── Vercel Cron — seguimiento de negociaciones activas
```

---

## Por qué Cloudflare Email y no Gmail MCP

Gmail MCP requiere que el usuario conecte su cuenta personal — fricción enorme y riesgo de confianza real. Nadie le da acceso a su Gmail a una app de hackathon.

Con Cloudflare Email Service:
- Susi tiene su propio sistema de email — el usuario no conecta nada
- Cada negociación recibe una dirección única: `negotiate-[id]@meetsusi.com`
- El vendedor recibe un email de una persona (Susi), no de una herramienta
- Cloudflare maneja SPF, DKIM y DMARC automáticamente
- Las respuestas vuelven al agente correcto via routing seguro con HMAC-SHA256

El usuario le dice al vendedor: *"te va a escribir mi asistente Susi"* — o no dice nada y Susi escribe directo.

### Flujo de email completo

```
Usuario aprueba el primer email en el chat
              ↓
Cloudflare Email Sending lo manda desde negotiate-[id]@meetsusi.com
              ↓
El vendedor responde → llega a esa dirección
              ↓
Cloudflare Email Routing → webhook → Vercel
              ↓
Agente analiza la respuesta, decide próximo movimiento
              ↓
Si hay descuento → notifica al usuario en el chat
```

---

## Skills de Susi

```
/skills
  /negotiation-core     → principios universales: anclar, BATNA, urgencia, silencio
  /category-saas        → ciclos de renovación, competidores, descuentos típicos
  /category-auto        → cómo negocian los dealers, qué palancas existen
  /category-real-estate → contraofertas, contingencias, plazos
  /category-high-ticket → productos de lujo, electrónica, servicios
```

---

## Flujo del agente (MVP)

```
1. Usuario describe qué quiere negociar + contexto (factura, link, presupuesto)
2. Susi investiga precio de mercado (web search)
3. Redacta primer email — usuario aprueba antes de enviar
4. Susi manda el email desde negotiate-[id]@meetsusi.com
5. Monitorea respuestas — analiza y propone siguiente movimiento
6. Itera hasta conseguir descuento o agotar opciones
7. Notifica al usuario: "Pasé de $X a $Y — ahorraste $Z"
8. Usuario cierra el trato
```

---

## Scope MVP para el hackathon

**Incluye:**
- Onboarding conversacional — qué querés negociar + contexto
- Research automático de precio de mercado
- Redacción y envío de emails de negociación (con aprobación del usuario)
- Manejo de respuestas y contra-ofertas
- Resumen de ahorro conseguido

**Roadmap (post-hackathon):**
- Llamadas telefónicas via Bland.ai
- Modelo de cobro automático (% del ahorro)
- Más categorías de negociación
- Dashboard de ahorros históricos

---

## Reglas del hackathon

- Submission window: 24 abril — 3 mayo (PT)
- Voting: 4 mayo
- Solo challenge (individual)
- Deploy en Vercel requerido
- Ganadores: votos de comunidad + criterio del equipo Vercel

---

## Nombre, dominio y taglines

**Meet Susi** — meetsusi.com

Taglines:
- *"Everyone deserves a Susi."*
- *"Susi negotiates. You decide."*
- *"Susi handles the awkward part of every negotiation."*
- *"The seller has a better price ready. Susi asks for it."*
