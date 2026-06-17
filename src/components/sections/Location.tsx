import { useTranslation } from 'react-i18next';
import { MAP_URL } from '../../config';
import { Section } from '../Section';

export function Location() {
  const { t } = useTranslation();

  return (
    <Section id="location" title={t('location.title')}>
      <div className="mx-auto max-w-xl space-y-8">
        <div className="text-center">
          <p className="font-serif text-2xl text-stone-800">{t('location.venueName')}</p>
          <p className="mt-1 text-stone-600">{t('location.address')}</p>
          <a
            href={MAP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-sand px-6 py-2.5 text-sm font-medium text-sand-dark transition hover:bg-sand hover:text-white"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
              />
            </svg>
            {t('location.mapCta')}
          </a>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-white/60 p-5 text-center">
            <h3 className="font-medium text-stone-800">{t('location.parkingTitle')}</h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">{t('location.parking')}</p>
          </div>
          <div className="rounded-2xl bg-white/60 p-5 text-center">
            <h3 className="font-medium text-stone-800">{t('location.accessTitle')}</h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">{t('location.access')}</p>
          </div>
        </div>
      </div>
    </Section>
  );
}
