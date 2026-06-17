import { useTranslation } from 'react-i18next';
import { Section } from '../Section';

export function Story() {
  const { t } = useTranslation();

  return (
    <Section id="story" title={t('story.title')}>
      <div className="mx-auto max-w-xl space-y-5 text-center text-lg leading-relaxed text-stone-600">
        <p>{t('story.p1')}</p>
        <p>{t('story.p2')}</p>
      </div>
    </Section>
  );
}
