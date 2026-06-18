import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from '../components/LanguageToggle';
import { Stepper } from '../components/Stepper';
import { useLanguage } from '../i18n/LanguageProvider';
import { getInvite, submitRsvp } from '../lib/rsvp';
import { notifyRsvp } from '../lib/whatsapp';
import { DIETARY_KINDS, parseDietary, serializeDietary } from '../lib/dietary';
import type { DietaryKind, InviteData, InviteRsvp } from '../types';

type Status = 'loading' | 'invalid' | 'error' | 'form' | 'confirmed';

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center bg-cream px-6 py-16">
      <div className="absolute end-4 top-4">
        <LanguageToggle />
      </div>
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}

export default function Rsvp() {
  const { token = '' } = useParams();
  const { t } = useTranslation();
  const { setLang } = useLanguage();

  const [status, setStatus] = useState<Status>('loading');
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [savedRsvp, setSavedRsvp] = useState<InviteRsvp | null>(null);

  // Form state
  const [attending, setAttending] = useState(true);
  const [adults, setAdults] = useState(1);
  const [kids, setKids] = useState(0);
  const [dietaryKind, setDietaryKind] = useState<DietaryKind>('none');
  const [dietaryOther, setDietaryOther] = useState('');
  const [blessing, setBlessing] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function hydrateForm(rsvp: InviteRsvp | null) {
    if (!rsvp) return;
    setAttending(rsvp.attending);
    setAdults(Math.max(rsvp.num_adults, rsvp.attending ? 1 : 0));
    setKids(rsvp.num_kids);
    const { kind, other } = parseDietary(rsvp.dietary);
    setDietaryKind(kind);
    setDietaryOther(other);
    setBlessing(rsvp.blessing ?? '');
  }

  const load = async () => {
    setStatus('loading');
    try {
      const data = await getInvite(token);
      if (!data) {
        setStatus('invalid');
        return;
      }
      setInvite(data);
      setLang(data.guest.language); // honour the guest's language; toggle still works
      if (data.rsvp) {
        setSavedRsvp(data.rsvp);
        hydrateForm(data.rsvp);
        setStatus('confirmed');
      } else {
        setStatus('form');
      }
    } catch {
      setStatus('error');
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const maxParty = invite?.guest.max_party ?? 1;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const rsvp = await submitRsvp({
        token,
        attending,
        numAdults: attending ? adults : 0,
        numKids: attending ? kids : 0,
        dietary: attending ? serializeDietary(dietaryKind, dietaryOther) : null,
        blessing: blessing.trim() || null,
      });
      setSavedRsvp(rsvp);
      setStatus('confirmed');
      void notifyRsvp(token); // best-effort: ping the couple's WhatsApp feed
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      setFormError(message.includes('party_too_large') ? t('rsvpPage.partyTooLarge') : t('rsvpPage.submitError'));
    } finally {
      setSubmitting(false);
    }
  }

  if (status === 'loading') {
    return (
      <Shell>
        <p className="text-center text-stone-500">{t('rsvpPage.loading')}</p>
      </Shell>
    );
  }

  if (status === 'invalid' || status === 'error') {
    const isInvalid = status === 'invalid';
    return (
      <Shell>
        <div className="text-center">
          <h1 className="font-serif text-3xl text-stone-800">
            {t(isInvalid ? 'rsvpPage.invalidTitle' : 'rsvpPage.errorTitle')}
          </h1>
          <p className="mt-4 leading-relaxed text-stone-600">
            {t(isInvalid ? 'rsvpPage.invalidBody' : 'rsvpPage.errorBody')}
          </p>
          {!isInvalid && (
            <button
              type="button"
              onClick={() => void load()}
              className="mt-6 rounded-full bg-sand px-7 py-2.5 text-sm font-medium text-white transition hover:bg-sand-dark"
            >
              {t('rsvpPage.retry')}
            </button>
          )}
          <a href="/" className="mt-6 block text-sm text-stone-400 hover:text-sand-dark">
            {t('rsvpPage.backToSite')}
          </a>
        </div>
      </Shell>
    );
  }

  if (status === 'confirmed' && savedRsvp) {
    return (
      <Shell>
        <div className="rounded-3xl bg-white/60 px-6 py-10 text-center">
          <h1 className="font-serif text-3xl text-stone-800">
            {t(savedRsvp.attending ? 'rsvpPage.confirmTitleYes' : 'rsvpPage.confirmTitleNo')}
          </h1>
          <p className="mt-4 leading-relaxed text-stone-600">
            {t(savedRsvp.attending ? 'rsvpPage.confirmBodyYes' : 'rsvpPage.confirmBodyNo')}
          </p>

          {savedRsvp.attending && (
            <p className="mt-3 text-sm font-medium text-sand-dark">
              {t('rsvpPage.confirmCount', { adults: savedRsvp.num_adults, kids: savedRsvp.num_kids })}
            </p>
          )}

          {savedRsvp.attending && invite?.table && (
            <div className="mt-6 rounded-2xl bg-sand/10 px-5 py-4">
              <p className="text-xs uppercase tracking-wider text-stone-500">{t('rsvpPage.tableLabel')}</p>
              <p className="mt-1 font-serif text-2xl text-sand-dark">{invite.table.name}</p>
              {invite.table.zone && <p className="text-sm text-stone-500">{invite.table.zone}</p>}
            </div>
          )}

          <button
            type="button"
            onClick={() => setStatus('form')}
            className="mt-8 rounded-full border border-sand px-7 py-2.5 text-sm font-medium text-sand-dark transition hover:bg-sand hover:text-white"
          >
            {t('rsvpPage.edit')}
          </button>
          <a href="/" className="mt-5 block text-sm text-stone-400 hover:text-sand-dark">
            {t('rsvpPage.backToSite')}
          </a>
        </div>
      </Shell>
    );
  }

  // status === 'form'
  const guest = invite!.guest;

  return (
    <Shell>
      <form onSubmit={handleSubmit} className="space-y-7">
        <header className="text-center">
          <h1 className="font-serif text-3xl text-stone-800">
            {t('rsvpPage.greeting', { name: guest.party_label || guest.full_name })}
          </h1>
          <p className="mt-2 text-stone-600">{t('rsvpPage.intro')}</p>
          <p className="mt-1 text-sm text-stone-400">
            {t('rsvpPage.seatsNote', { count: maxParty })}
          </p>
          {savedRsvp && (
            <p className="mt-3 text-xs text-sand-dark">{t('rsvpPage.alreadyResponded')}</p>
          )}
        </header>

        {/* Attending toggle */}
        <fieldset>
          <legend className="mb-3 text-center text-sm text-stone-500">
            {t('rsvpPage.attendingQuestion')}
          </legend>
          <div className="grid grid-cols-2 gap-3">
            {[true, false].map((value) => (
              <button
                key={String(value)}
                type="button"
                onClick={() => setAttending(value)}
                aria-pressed={attending === value}
                className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                  attending === value
                    ? 'border-sand bg-sand text-white shadow-sm'
                    : 'border-stone-300 bg-white/60 text-stone-600 hover:border-sand'
                }`}
              >
                {t(value ? 'rsvpPage.yes' : 'rsvpPage.no')}
              </button>
            ))}
          </div>
        </fieldset>

        {attending && (
          <div className="space-y-6 rounded-2xl bg-white/60 px-5 py-5">
            <Stepper
              label={t('rsvpPage.adults')}
              value={adults}
              onChange={setAdults}
              min={1}
              max={maxParty - kids}
            />
            <Stepper
              label={t('rsvpPage.kids')}
              value={kids}
              onChange={setKids}
              min={0}
              max={maxParty - adults}
            />

            <div>
              <label htmlFor="dietary" className="mb-2 block text-stone-700">
                {t('rsvpPage.dietaryLabel')}
              </label>
              <select
                id="dietary"
                value={dietaryKind}
                onChange={(e) => setDietaryKind(e.target.value as DietaryKind)}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-stone-800 focus:border-sand focus:outline-none"
              >
                {DIETARY_KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {t(`rsvpPage.dietary_${kind}`)}
                  </option>
                ))}
              </select>
              {dietaryKind === 'other' && (
                <input
                  type="text"
                  value={dietaryOther}
                  onChange={(e) => setDietaryOther(e.target.value)}
                  placeholder={t('rsvpPage.dietaryOtherPlaceholder')}
                  className="mt-3 w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-stone-800 focus:border-sand focus:outline-none"
                />
              )}
            </div>
          </div>
        )}

        {/* Blessing */}
        <div>
          <label htmlFor="blessing" className="mb-2 block text-stone-700">
            {t('rsvpPage.blessingLabel')}
          </label>
          <textarea
            id="blessing"
            value={blessing}
            onChange={(e) => setBlessing(e.target.value)}
            rows={3}
            placeholder={t('rsvpPage.blessingPlaceholder')}
            className="w-full resize-none rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-stone-800 focus:border-sand focus:outline-none"
          />
        </div>

        {formError && <p className="text-center text-sm text-red-600">{formError}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-sand px-8 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-sand-dark disabled:opacity-60"
        >
          {submitting ? t('rsvpPage.submitting') : t(savedRsvp ? 'rsvpPage.update' : 'rsvpPage.submit')}
        </button>
      </form>
    </Shell>
  );
}
