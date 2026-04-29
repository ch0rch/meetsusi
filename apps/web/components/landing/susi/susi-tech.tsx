"use client";

import { useT } from "@/lib/i18n/provider";
import { MonoLabel } from "./mono-label";

const TECH_STACK = [
  { name: "Vercel Workflow SDK", role: "Durable agent execution" },
  { name: "Claude / AI SDK", role: "Email reasoning & negotiation" },
  { name: "Resend", role: "Email delivery" },
  { name: "Supabase", role: "Data & auth" },
  { name: "Next.js", role: "Web application" },
  { name: "Vercel", role: "Deployment" },
];

export function SusiTech() {
  const t = useT();

  return (
    <section className="bg-susi-midnight py-24 md:py-32">
      <div className="mx-auto max-w-[1320px] px-6">
        <MonoLabel dark className="mb-6">
          {t.tech.label}
        </MonoLabel>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <h2 className="susi-display-section text-3xl text-white sm:text-4xl">
              {t.tech.heading}
            </h2>
            <p className="mt-6 text-base leading-relaxed text-white/55">
              {t.tech.body}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 self-start">
            {TECH_STACK.map((item) => (
              <div key={item.name} className="susi-card-dark p-5">
                <p className="text-sm font-medium text-white">{item.name}</p>
                <p className="mt-1 text-xs text-white/40">{item.role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
