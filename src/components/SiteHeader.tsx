import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from './LanguageToggle';

const NAV_LINKS = [
  { href: '#story', key: 'nav.story' },
  { href: '#schedule', key: 'nav.schedule' },
  { href: '#location', key: 'nav.location' },
  { href: '#rsvp', key: 'nav.rsvp' },
] as const;

/** Sticky top bar: appears once the user scrolls past the hero. */
export function SiteHeader() {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.7);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-stone-200/70 bg-cream/90 py-3 shadow-sm backdrop-blur'
          : 'pointer-events-none py-4 opacity-0'
      }`}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6">
        <a href="#top" className="font-serif text-lg text-stone-800">
          {t('home.names')}
        </a>
        <nav className="hidden items-center gap-6 text-sm text-stone-600 sm:flex">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="transition hover:text-sand-dark">
              {t(link.key)}
            </a>
          ))}
        </nav>
        <div className="pointer-events-auto">
          <LanguageToggle />
        </div>
      </div>
    </header>
  );
}
