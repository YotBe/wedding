import { useTranslation } from 'react-i18next';
import { LanguageToggle } from '../LanguageToggle';

/**
 * Full-screen hero. Drop a photo at `public/hero.jpg` to replace the gradient
 * (it layers under the text via the background image below).
 */
export function Hero() {
  const { t } = useTranslation();

  return (
    <section
      id="top"
      className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-6 py-20 text-center"
      style={{
        backgroundImage:
          'linear-gradient(180deg, rgba(250,246,240,0.35) 0%, rgba(250,246,240,0.65) 60%, var(--color-cream) 100%), url(/hero.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute end-4 top-4 z-10">
        <LanguageToggle />
      </div>

      <p className="mb-5 text-xs font-medium uppercase tracking-[0.35em] text-sand-dark">
        {t('home.kicker')}
      </p>

      <h1 className="font-serif text-6xl font-light leading-none text-stone-800 sm:text-7xl md:text-8xl">
        {t('home.names')}
      </h1>

      <div className="mt-8 space-y-1 text-lg text-stone-600 sm:text-xl">
        <p>{t('home.dateLong')}</p>
        <p>{t('home.venue')}</p>
      </div>

      <p className="mt-8 max-w-md text-stone-500">{t('home.tagline')}</p>

      <a
        href="#rsvp"
        className="mt-10 inline-block rounded-full bg-sand px-9 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-sand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sand"
      >
        {t('home.cta')}
      </a>

      <a
        href="#story"
        className="absolute inset-x-0 bottom-6 mx-auto flex flex-col items-center gap-2 text-xs text-stone-400 transition hover:text-sand-dark"
      >
        <span>{t('home.scrollHint')}</span>
        <svg
          className="h-5 w-5 animate-bounce"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </a>
    </section>
  );
}
