export type Lang = "en" | "es";

export type StatEntry = {
  value: string;
  description: string;
};

export type Step = {
  title: string;
  body: string;
};

export type CategoryItem = {
  label: string;
  description: string;
};

export type DifferentiatorItem = {
  title: string;
  body: string;
};

export type CopyTree = {
  nav: {
    signIn: string;
  };
  hero: {
    tagline: string;
    subtitle: string;
    cta: string;
  };
  problem: {
    label: string;
    heading: string;
    body: string;
  };
  stats: {
    label: string;
    cars: StatEntry;
    saas: StatEntry;
    rent: StatEntry;
  };
  how: {
    label: string;
    heading: string;
    steps: [Step, Step, Step];
  };
  categories: {
    label: string;
    heading: string;
    items: [
      CategoryItem,
      CategoryItem,
      CategoryItem,
      CategoryItem,
      CategoryItem,
      CategoryItem,
    ];
  };
  why: {
    label: string;
    heading: string;
    items: [
      DifferentiatorItem,
      DifferentiatorItem,
      DifferentiatorItem,
      DifferentiatorItem,
    ];
  };
  tech: {
    label: string;
    heading: string;
    body: string;
  };
  finalCta: {
    heading: string;
    body: string;
    cta: string;
  };
  footer: {
    tagline: string;
    about: string;
    builtBy: string;
    hackathon: string;
  };
  about: {
    title: string;
    paragraphs: [string, string, string, string, string, string];
    signature: string;
    backHome: string;
  };
};
