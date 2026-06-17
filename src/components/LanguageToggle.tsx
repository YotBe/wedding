import { useTranslation } from 'react-i18next';
import { useLanguage } from '../i18n/LanguageProvider';

export function LanguageToggle() {
  const { t } = useTranslation();
  const { toggleLang } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggleLang}
      aria-label={t('lang.switchAria')}
      className="rounded-full border border-stone-300 bg-white/70 px-4 py-2 text-sm font-medium text-stone-700 backdrop-blur transition hover:border-sand hover:text-sand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sand"
    >
      {t('lang.toggleTo')}
    </button>
  );
}
