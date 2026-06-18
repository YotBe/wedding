import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from '../components/LanguageToggle';
import { findTable } from '../lib/findTable';
import type { InviteTable } from '../types';

type Result = { status: 'idle' | 'searching' | 'found' | 'notfound' | 'error'; table?: InviteTable };

export default function FindTable() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  // Venue-entrance kiosk mode: ?kiosk=1 — bigger UI, auto-resets for the next guest.
  const kiosk = params.get('kiosk') === '1';
  const [name, setName] = useState('');
  const [result, setResult] = useState<Result>({ status: 'idle' });

  // In kiosk mode, clear the screen a few seconds after showing a result.
  useEffect(() => {
    if (!kiosk || (result.status !== 'found' && result.status !== 'notfound')) return;
    const id = setTimeout(() => {
      setResult({ status: 'idle' });
      setName('');
    }, 8000);
    return () => clearTimeout(id);
  }, [kiosk, result.status]);

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

      <div className={`w-full text-center ${kiosk ? 'max-w-2xl' : 'max-w-md'}`}>
        <h1 className={`font-serif text-stone-800 ${kiosk ? 'text-5xl' : 'text-3xl'}`}>
          {t('findTable.title')}
        </h1>
        <p className={`mt-3 text-stone-600 ${kiosk ? 'text-xl' : ''}`}>{t('findTable.intro')}</p>

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
              <p className={`mt-2 font-serif text-sand-dark ${kiosk ? 'text-7xl' : 'text-4xl'}`}>
                {result.table.name}
              </p>
              {result.table.zone && (
                <p className={`mt-1 text-stone-500 ${kiosk ? 'text-2xl' : ''}`}>{result.table.zone}</p>
              )}
            </div>
          )}
          {result.status === 'notfound' && (
            <p className="leading-relaxed text-stone-600">{t('findTable.notFound')}</p>
          )}
          {result.status === 'error' && (
            <p className="leading-relaxed text-red-600">{t('findTable.error')}</p>
          )}
        </div>

        {!kiosk && (
          <a href="/" className="mt-6 block text-sm text-stone-400 hover:text-sand-dark">
            {t('rsvpPage.backToSite')}
          </a>
        )}
      </div>
    </main>
  );
}
