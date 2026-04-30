import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { Providers } from "./providers";
import "./globals.css";

const UMAMI_WEBSITE_ID = "60c9a714-ebc9-4a8f-a4eb-554a3994a819";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const langInitializationScript = `
(() => {
  const key = "meetsusi-lang";
  const stored = localStorage.getItem(key);
  const lang = stored === "en" || stored === "es"
    ? stored
    : navigator.language.startsWith("es") ? "es" : "en";
  document.documentElement.dataset.lang = lang;
})();
`;

const themeInitializationScript = `
(() => {
  const storageKey = "meetsusi-theme";
  const darkModeMediaQuery = "(prefers-color-scheme: dark)";
  const storedTheme = window.localStorage.getItem(storageKey);

  const theme =
    storedTheme === "light" || storedTheme === "dark" || storedTheme === "system"
      ? storedTheme
      : "system";

  const resolvedTheme =
    theme === "system"
      ? window.matchMedia(darkModeMediaQuery).matches
        ? "dark"
        : "light"
      : theme;

  document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
})();
`;

const metadataBase =
  process.env.VERCEL_ENV === "production" &&
  process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? new URL(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`)
    : process.env.VERCEL_URL
      ? new URL(`https://${process.env.VERCEL_URL}`)
      : new URL("https://meetsusi.com");

const SITE_TITLE =
  "Meet Susi — The AI agent that negotiates your bills by email";
const SITE_DESCRIPTION =
  "Save 20-40% on SaaS, rent, cars and services. Susi runs as a durable agent — she can wait days for a vendor reply, draft counter-offers, and only interrupts when she has news. You approve every email.";

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: SITE_TITLE,
    template: "%s | Meet Susi",
  },
  description: SITE_DESCRIPTION,
  applicationName: "Meet Susi",
  keywords: [
    "AI negotiation",
    "negotiation agent",
    "SaaS negotiation",
    "rent negotiation",
    "AI assistant",
    "durable agent",
    "email AI",
    "bill negotiation",
    "Vercel Workflow SDK",
    "Zero to Agent",
  ],
  authors: [{ name: "Meet Susi" }],
  creator: "Meet Susi",
  openGraph: {
    type: "website",
    siteName: "Meet Susi",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: "en_US",
    alternateLocale: ["es_AR"],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans overflow-x-hidden antialiased`}
      >
        <script
          dangerouslySetInnerHTML={{ __html: langInitializationScript }}
        />
        <script
          dangerouslySetInnerHTML={{ __html: themeInitializationScript }}
        />
        <Providers>{children}</Providers>
        <Analytics />
        {process.env.NODE_ENV === "production" ? (
          <Script
            defer
            src="https://cloud.umami.is/script.js"
            data-website-id={UMAMI_WEBSITE_ID}
            strategy="afterInteractive"
          />
        ) : null}
      </body>
    </html>
  );
}
