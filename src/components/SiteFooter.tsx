import { useTranslation } from 'react-i18next';

export function SiteFooter() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-stone-200/70 py-10 text-center">
      <p className="font-serif text-2xl text-stone-800">{t('footer.names')}</p>
      <p className="mt-1 text-sm text-stone-500">{t('footer.date')}</p>
      <a href="/find-table" className="mt-4 inline-block text-sm text-sand-dark hover:underline">
        {t('footer.findTable')}
      </a>
      <p className="mt-3 text-xs uppercase tracking-widest text-stone-400">{t('footer.madeWith')}</p>
    </footer>
  );
}
