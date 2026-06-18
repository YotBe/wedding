import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { listGuests } from '../../lib/admin';
import { computeStats, type RsvpStats } from '../../lib/stats';
import { DIETARY_KINDS } from '../../lib/dietary';

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-2xl px-5 py-4 ${accent ? 'bg-sand text-white' : 'bg-white/70 text-stone-800'}`}>
      <p className="font-serif text-3xl tabular-nums">{value}</p>
      <p className={`mt-1 text-xs ${accent ? 'text-white/80' : 'text-stone-500'}`}>{label}</p>
    </div>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<RsvpStats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    listGuests()
      .then((guests) => setStats(computeStats(guests)))
      .catch(() => setError(true));
  }, []);

  if (error) return <p className="text-stone-600">{t('admin.loadError')}</p>;
  if (!stats) return <p className="text-stone-500">{t('admin.loading')}</p>;

  return (
    <div className="space-y-8">
      <h1 className="font-serif text-3xl text-stone-800">{t('admin.dashboard.title')}</h1>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label={t('admin.stats.invites')} value={stats.invites} />
        <Stat label={t('admin.stats.responded')} value={stats.responded} />
        <Stat label={t('admin.stats.noResponse')} value={stats.noResponse} />
        <Stat label={t('admin.stats.headcount')} value={stats.headcount} accent />
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label={t('admin.stats.attending')} value={stats.attending} />
        <Stat label={t('admin.stats.declined')} value={stats.declined} />
        <Stat label={t('admin.stats.adults')} value={stats.adults} />
        <Stat label={t('admin.stats.kids')} value={stats.kids} />
      </section>

      <section>
        <h2 className="mb-3 font-medium text-stone-700">{t('admin.stats.dietaryTitle')}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {DIETARY_KINDS.map((kind) => (
            <Stat key={kind} label={t(`rsvpPage.dietary_${kind}`)} value={stats.dietary[kind]} />
          ))}
        </div>
      </section>
    </div>
  );
}
