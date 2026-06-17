import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { DEFAULT_LANG } from './index';
import type { Lang } from './index';

type Dir = 'rtl' | 'ltr';

const DIR_BY_LANG: Record<Lang, Dir> = {
  he: 'rtl',
  en: 'ltr',
};

interface LanguageContextValue {
  lang: Lang;
  dir: Dir;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();

  const lang = ((i18n.resolvedLanguage ?? DEFAULT_LANG) as Lang) in DIR_BY_LANG
    ? ((i18n.resolvedLanguage ?? DEFAULT_LANG) as Lang)
    : DEFAULT_LANG;
  const dir = DIR_BY_LANG[lang];

  // Keep the document root in sync so RTL/LTR and lang apply globally.
  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = dir;
  }, [lang, dir]);

  const setLang = useCallback(
    (next: Lang) => {
      void i18n.changeLanguage(next);
    },
    [i18n],
  );

  const toggleLang = useCallback(() => {
    void i18n.changeLanguage(lang === 'he' ? 'en' : 'he');
  }, [i18n, lang]);

  const value = useMemo<LanguageContextValue>(
    () => ({ lang, dir, setLang, toggleLang }),
    [lang, dir, setLang, toggleLang],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}
