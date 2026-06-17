import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PAYBOX_URL } from '../../config';
import { Section } from '../Section';

interface GiftRowProps {
  label: string;
  value: string;
  href?: string;
}

function GiftRow({ label, value, href }: GiftRowProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (e.g. insecure context) — silently ignore.
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/60 px-5 py-4">
      <div className="min-w-0 text-start">
        <p className="text-xs uppercase tracking-wider text-stone-500">{label}</p>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-stone-800 underline decoration-sand/60 underline-offset-2 hover:text-sand-dark"
          >
            {value}
          </a>
        ) : (
          <p className="truncate text-stone-800">{value}</p>
        )}
      </div>
      <button
        type="button"
        onClick={copy}
        className="shrink-0 rounded-full border border-stone-300 px-4 py-1.5 text-xs font-medium text-stone-600 transition hover:border-sand hover:text-sand-dark"
      >
        {copied ? t('gift.copied') : t('gift.copy')}
      </button>
    </div>
  );
}

export function Gift() {
  const { t } = useTranslation();

  return (
    <Section id="gift" title={t('gift.title')} className="bg-white/40">
      <div className="mx-auto max-w-md">
        <p className="mb-8 text-center leading-relaxed text-stone-600">{t('gift.intro')}</p>
        <div className="space-y-3">
          <GiftRow label={t('gift.bitLabel')} value={t('gift.bitValue')} />
          <GiftRow label={t('gift.payboxLabel')} value={t('gift.payboxValue')} href={PAYBOX_URL} />
          <GiftRow label={t('gift.bankLabel')} value={t('gift.bankValue')} />
        </div>
      </div>
    </Section>
  );
}
