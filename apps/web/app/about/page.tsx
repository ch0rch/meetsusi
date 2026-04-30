import type { Metadata } from "next";
import { AboutPage } from "./about-page";

export const metadata: Metadata = {
  title: "Why “Susi”",
  description:
    "The story behind Susi — named after my grandmother, who taught me that patience is a form of intelligence.",
  openGraph: {
    title: "Why “Susi” | Meet Susi",
    description:
      "The story behind Susi — named after my grandmother, who taught me that patience is a form of intelligence.",
  },
};

export default function About() {
  return <AboutPage />;
}
