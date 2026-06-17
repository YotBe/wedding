import { useTranslation } from 'react-i18next';
import { WEDDING_DATE } from '../../config';
import { useCountdown } from '../../hooks/useCountdown';

export function Countdown() {
  const { t } = useTranslation();
  const { days, hours, minutes, seconds, isPast } = useCountdown(WEDDING_DATE);

  if (isPast) {
    return (
      <div className="bg-sand/10 py-10 text-center">
        <p className="font-serif text-2xl text-sand-dark">{t('countdown.today')}</p>
      </div>
    );
  }

  const units = [
    { value: days, label: t('countdown.days') },
    { value: hours, label: t('countdown.hours') },
    { value: minutes, label: t('countdown.minutes') },
    { value: seconds, label: t('countdown.seconds') },
  ];

  return (
    <div className="bg-sand/10 py-10">
      <ul className="mx-auto flex max-w-md items-stretch justify-center gap-3 px-6 sm:gap-6">
        {units.map((unit) => (
          <li key={unit.label} className="flex flex-1 flex-col items-center">
            <span className="font-serif text-3xl tabular-nums text-sand-dark sm:text-5xl">
              {String(unit.value).padStart(2, '0')}
            </span>
            <span className="mt-1 text-[0.65rem] uppercase tracking-widest text-stone-500 sm:text-xs">
              {unit.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
