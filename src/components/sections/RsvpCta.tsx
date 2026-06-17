import { useTranslation } from 'react-i18next';
import { Section } from '../Section';

export function RsvpCta() {
  const { t } = useTranslation();

  return (
    <Section id="rsvp">
      <div className="mx-auto max-w-lg rounded-3xl bg-sand/10 px-6 py-12 text-center">
        <h2 className="font-serif text-3xl font-medium text-stone-800 sm:text-4xl">
          {t('rsvp.title')}
        </h2>
        <p className="mt-4 leading-relaxed text-stone-600">{t('rsvp.text')}</p>
        <p className="mt-2 text-sm font-medium text-sand-dark">{t('rsvp.deadline')}</p>

        <a
          href="#top"
          className="mt-8 inline-block rounded-full bg-sand px-9 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-sand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sand"
        >
          {t('rsvp.cta')}
        </a>

        <p className="mt-6 text-xs text-stone-400">{t('rsvp.noToken')}</p>
      </div>
    </Section>
  );
}
