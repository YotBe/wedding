import { useTranslation } from 'react-i18next';
import { Section } from '../Section';

interface ScheduleItem {
  time: string;
  label: string;
}

export function Schedule() {
  const { t } = useTranslation();
  const items = t('schedule.items', { returnObjects: true }) as ScheduleItem[];

  return (
    <Section id="schedule" title={t('schedule.title')} className="bg-white/40">
      <ol className="mx-auto max-w-md space-y-0">
        {items.map((item, i) => (
          <li key={item.label} className="flex items-stretch gap-5">
            {/* Timeline rail */}
            <div className="flex flex-col items-center">
              <span className="mt-2 h-3 w-3 shrink-0 rounded-full bg-sand" aria-hidden="true" />
              {i < items.length - 1 && <span className="w-px flex-1 bg-sand/30" aria-hidden="true" />}
            </div>
            <div className="pb-8">
              <p className="font-serif text-2xl text-sand-dark">{item.time}</p>
              <p className="mt-1 text-stone-600">{item.label}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
