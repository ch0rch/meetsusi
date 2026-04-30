import type { CopyTree, Lang } from "./types";

const en: CopyTree = {
  nav: {
    signIn: "Sign in",
  },
  hero: {
    tagline: "Everyone deserves a Susi.",
    subtitle:
      "Your personal negotiation agent. Tell Susi what you want to negotiate — she researches prices, drafts emails, and handles counter-offers. You decide. She delivers.",
    cta: "Get started free",
  },
  problem: {
    label: "The problem",
    heading:
      "Every price you've ever paid had a lower version. You just never asked.",
    body: "Sellers always have a better price they don't offer voluntarily. Most people never get it — not because it isn't available, but because asking feels awkward, they don't know how to start, and they don't have time to follow up.",
  },
  stats: {
    label: "Money left on the table",
    cars: {
      value: "8–15%",
      description:
        "off a $30k car. That's up to $4,500 most buyers leave behind.",
    },
    saas: {
      value: "30–40%",
      description:
        "SaaS discount pre-approved for retention. Almost nobody asks.",
    },
    rent: {
      value: "5–10%",
      description:
        "off your rent. That's $2,400/year on a $2k/month apartment.",
    },
  },
  how: {
    label: "How Susi works",
    heading: "Three steps to a better price.",
    steps: [
      {
        title: "You tell her",
        body: "Describe what you want to buy, what you're currently paying, and what you'd like to pay. That's it.",
      },
      {
        title: "She negotiates",
        body: "Susi researches market prices, drafts a professional email, and handles the back-and-forth. All from her own inbox.",
      },
      {
        title: "You decide",
        body: "When the seller responds with a better offer, Susi brings it to you. You approve. She closes.",
      },
    ],
  },
  categories: {
    label: "What she negotiates",
    heading: "From software to apartments.",
    items: [
      {
        label: "SaaS & Software",
        description: "Renewals, new contracts, enterprise pricing",
      },
      {
        label: "Cars & Vehicles",
        description: "New and used, dealers and private sellers",
      },
      {
        label: "Rent & Real Estate",
        description: "Monthly rent, lease renewals, deposits",
      },
      {
        label: "Insurance",
        description: "Car, home, health — all policies",
      },
      {
        label: "Agency Services",
        description: "Marketing, consulting, design retainers",
      },
      {
        label: "Business Supplies",
        description: "B2B contracts, vendor agreements",
      },
    ],
  },
  why: {
    label: "Why Susi",
    heading: "Built different.",
    items: [
      {
        title: "Her own email address",
        body: "Susi uses negotiate-[id]@meetsusi.com. No access to your inbox. No permissions needed.",
      },
      {
        title: "Only paid when you win",
        body: "Susi's fee is a percentage of what she saves you. If she doesn't save you anything, you don't pay.",
      },
      {
        title: "Durable by design",
        body: "Susi can wait days for a vendor reply without losing context. Real negotiations take time.",
      },
      {
        title: "Looks like a person",
        body: "The vendor receives a professional email from a real address. Great negotiation is about conversation, not automation.",
      },
    ],
  },
  tech: {
    label: "Under the hood",
    heading: "Built on Vercel's production stack.",
    body: "Susi's negotiation workflow runs on Vercel Workflow SDK — durable executions that survive crashes and wait days for replies. AI reasoning runs on Claude via AI SDK. Emails are delivered via Resend. Data lives in Supabase.",
  },
  finalCta: {
    heading: "The seller has a better price ready.",
    body: "They're just waiting for someone to ask. Now someone will. Her name is Susi.",
    cta: "Get started free",
  },
  footer: {
    tagline: "Everyone deserves a Susi.",
    about: "Why “Susi”",
    builtBy: "Built with care by",
    hackathon: "for the Vercel Zero to Agent Hackathon",
  },
  about: {
    title: "Why it's called Susi",
    paragraphs: [
      "Susi was my grandmother.",
      "At eighteen, a degenerative illness took the movement of her body — but never the movement of her mind. She lived like that for half a century, and in every one of those years she was the most curious, patient, and wise person I've ever known. She taught me to explore, to ask questions, to slow down, to trust that good things take their time.",
      "I was born on her birthday. She always said I was her birthday gift.",
      "This project is mine to her.",
      "The Susi you're using now does what the real Susi did: she listens carefully, waits for the right moment, speaks calmly, never pushes. When a negotiation stalls for days, she doesn't get impatient. Because the real Susi taught me that patience is a form of intelligence.",
      "If she helps you close better deals — and reclaim some time for yourself — part of the credit is hers.",
    ],
    signature: "— Chorch",
    backHome: "Back home",
  },
};

const es: CopyTree = {
  nav: {
    signIn: "Ingresar",
  },
  hero: {
    tagline: "Todos merecen una Susi.",
    subtitle:
      "Tu agente personal de negociación. Decile a Susi qué querés negociar — ella investiga precios, redacta emails y maneja las contra-ofertas. Vos decidís. Ella entrega.",
    cta: "Empezar gratis",
  },
  problem: {
    label: "El problema",
    heading:
      "Cada precio que pagaste tenía una versión más baja. Nunca la pediste.",
    body: "Los vendedores siempre tienen un precio mejor que no ofrecen por iniciativa propia. La mayoría nunca lo consigue — no porque no exista, sino porque pedir incomoda, no saben cómo empezar y no tienen tiempo para el seguimiento.",
  },
  stats: {
    label: "Plata sobre la mesa",
    cars: {
      value: "8–15%",
      description:
        "de descuento en un auto de $30k. Hasta $4.500 que la mayoría deja ir.",
    },
    saas: {
      value: "30–40%",
      description:
        "de descuento SaaS pre-aprobado para retención. Casi nadie lo pide.",
    },
    rent: {
      value: "5–10%",
      description:
        "de descuento en tu alquiler. $2.400 al año en un depto de $2k/mes.",
    },
  },
  how: {
    label: "Cómo funciona Susi",
    heading: "Tres pasos para un mejor precio.",
    steps: [
      {
        title: "Vos le contás",
        body: "Describí qué querés comprar, cuánto estás pagando y cuánto querías pagar. Eso es todo.",
      },
      {
        title: "Ella negocia",
        body: "Susi investiga precios de mercado, redacta un email profesional y maneja el ida y vuelta. Todo desde su propia bandeja.",
      },
      {
        title: "Vos decidís",
        body: "Cuando el vendedor responde con una mejor oferta, Susi te la trae. Vos aprobás. Ella cierra.",
      },
    ],
  },
  categories: {
    label: "Qué negocia",
    heading: "De software a departamentos.",
    items: [
      {
        label: "SaaS & Software",
        description: "Renovaciones, contratos nuevos, precios enterprise",
      },
      {
        label: "Autos & Vehículos",
        description: "Nuevos y usados, concesionarios y particulares",
      },
      {
        label: "Alquileres",
        description: "Alquiler mensual, renovaciones, depósitos",
      },
      {
        label: "Seguros",
        description: "Auto, hogar, salud — todas las pólizas",
      },
      {
        label: "Servicios de Agencia",
        description: "Marketing, consultoría, retainers de diseño",
      },
      {
        label: "Suministros B2B",
        description: "Contratos con proveedores, acuerdos comerciales",
      },
    ],
  },
  why: {
    label: "Por qué Susi",
    heading: "Construida diferente.",
    items: [
      {
        title: "Su propio email",
        body: "Susi usa negotiate-[id]@meetsusi.com. Sin acceso a tu bandeja. Sin permisos.",
      },
      {
        title: "Cobra solo si ahorrás",
        body: "El honorario de Susi es un porcentaje de lo que te ahorra. Si no ahorrás nada, no pagás.",
      },
      {
        title: "Durable por diseño",
        body: "Susi puede esperar días la respuesta de un proveedor sin perder el contexto. Las negociaciones reales toman tiempo.",
      },
      {
        title: "Parece una persona",
        body: "El vendedor recibe un email profesional desde una dirección real. La buena negociación es una conversación, no automatización.",
      },
    ],
  },
  tech: {
    label: "Bajo el capó",
    heading: "Construido sobre el stack de producción de Vercel.",
    body: "El workflow de negociación de Susi corre en Vercel Workflow SDK — ejecuciones durables que sobreviven crashes y esperan días por respuestas. El razonamiento IA corre en Claude vía AI SDK. Los emails se envían via Resend. Los datos viven en Supabase.",
  },
  finalCta: {
    heading: "El vendedor ya tiene un mejor precio listo.",
    body: "Solo está esperando que alguien lo pida. Ahora alguien lo hará. Su nombre es Susi.",
    cta: "Empezar gratis",
  },
  footer: {
    tagline: "Todos merecen una Susi.",
    about: "Por qué “Susi”",
    builtBy: "Construido con cariño por",
    hackathon: "para el Vercel Zero to Agent Hackathon",
  },
  about: {
    title: "Por qué se llama Susi",
    paragraphs: [
      "Susi era mi abuela.",
      "A los 18 años, una enfermedad degenerativa le quitó el movimiento del cuerpo — pero no de la mente. Vivió así medio siglo más, y en cada uno de esos años fue la persona más curiosa, paciente y sabia que conocí. Me enseñó a explorar, a hacer preguntas, a no apurarme, a confiar en que las cosas buenas tardan.",
      "Yo nací en su cumpleaños. Ella siempre dijo que yo era su regalo.",
      "Este proyecto es el mío para ella.",
      "La Susi que estás usando hace lo mismo que hacía la Susi real: escucha con atención, espera el momento justo, habla con calma, nunca empuja. Cuando una negociación se estanca por días, no se impacienta. Porque la verdadera Susi me enseñó que la paciencia es una forma de inteligencia.",
      "Si te ayuda a cerrar mejores tratos — y a recuperar tiempo para vos — parte del crédito es de ella.",
    ],
    signature: "— Chorch",
    backHome: "Volver al inicio",
  },
};

export const copy: Record<Lang, CopyTree> = { en, es };
