"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { copy } from "./copy";
import type { CopyTree, Lang } from "./types";

const LANG_STORAGE_KEY = "meetsusi-lang";

interface I18nContextValue {
  lang: Lang;
  t: CopyTree;
  setLang: (lang: Lang) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function isLang(value: unknown): value is Lang {
  return value === "en" || value === "es";
}

function getInitialLang(): Lang {
  if (typeof document === "undefined") return "en";
  const fromDataset = document.documentElement.dataset.lang;
  if (isLang(fromDataset)) return fromDataset;
  return "en";
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getInitialLang);

  const setLang = useCallback((nextLang: Lang) => {
    setLangState(nextLang);
    document.documentElement.dataset.lang = nextLang;
    localStorage.setItem(LANG_STORAGE_KEY, nextLang);
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({ lang, t: copy[lang], setLang }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export function useT() {
  return useI18n().t;
}

export function useLang() {
  const { lang, setLang } = useI18n();
  return { lang, setLang };
}
