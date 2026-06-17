import { useTranslation } from 'react-i18next';
import { LanguageToggle } from '../components/LanguageToggle';

export default function Home() {
  const { t } = useTranslation();

  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-cream px-6 py-16 text-center text-stone-800">
      <div className="absolute end-4 top-4">
        <LanguageToggle />
      </div>

      <p className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-sand">
        {t('home.kicker')}
      </p>

      <h1 className="text-5xl font-light leading-tight sm:text-6xl">{t('home.names')}</h1>

      <div className="mt-6 space-y-1 text-lg text-stone-600">
        <p>{t('home.date')}</p>
        <p>{t('home.venue')}</p>
      </div>

      <p className="mt-8 max-w-md text-stone-500">{t('home.tagline')}</p>

      <a
        href="#rsvp"
        className="mt-10 inline-block rounded-full bg-sand px-8 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-sand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sand"
      >
        {t('home.cta')}
      </a>

      <p className="mt-16 max-w-sm text-xs text-stone-400">{t('home.wip')}</p>
    </main>
  );
}
