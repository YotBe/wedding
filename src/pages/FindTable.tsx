import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from '../components/LanguageToggle';
import { findTable } from '../lib/findTable';
import type { InviteTable } from '../types';

type Result = { status: 'idle' | 'searching' | 'found' | 'notfound' | 'error'; table?: InviteTable };

export default function FindTable() {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [result, setResult] = useState<Result>({ status: 'idle' });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setResult({ status: 'searching' });
    try {
      const table = await findTable(name);
      setResult(table ? { status: 'found', table } : { status: 'notfound' });
    } catch {
      setResult({ status: 'error' });
    }
  }

  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center bg-cream px-6 py-16">
      <div className="absolute end-4 top-4">
        <LanguageToggle />
      </div>

      <div className="w-full max-w-md text-center">
        <h1 className="font-serif text-3xl text-stone-800">{t('findTable.title')}</h1>
        <p className="mt-3 text-stone-600">{t('findTable.intro')}</p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('findTable.placeholder')}
            className="flex-1 rounded-xl border border-stone-300 bg-white px-4 py-3 text-center text-stone-800 focus:border-sand focus:outline-none sm:text-start"
          />
          <button
            type="submit"
            disabled={result.status === 'searching'}
            className="rounded-full bg-sand px-8 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-sand-dark disabled:opacity-60"
          >
            {result.status === 'searching' ? t('findTable.searching') : t('findTable.search')}
          </button>
        </form>

        <div className="mt-8 min-h-[6rem]">
          {result.status === 'found' && result.table && (
            <div className="rounded-3xl bg-sand/10 px-6 py-8">
              <p className="text-xs uppercase tracking-wider text-stone-500">{t('findTable.yourTable')}</p>
              <p className="mt-2 font-serif text-4xl text-sand-dark">{result.table.name}</p>
              {result.table.zone && <p className="mt-1 text-stone-500">{result.table.zone}</p>}
            </div>
          )}
          {result.status === 'notfound' && (
            <p className="leading-relaxed text-stone-600">{t('findTable.notFound')}</p>
          )}
          {result.status === 'error' && (
            <p className="leading-relaxed text-red-600">{t('findTable.error')}</p>
          )}
        </div>

        <a href="/" className="mt-6 block text-sm text-stone-400 hover:text-sand-dark">
          {t('rsvpPage.backToSite')}
        </a>
      </div>
    </main>
  );
}
