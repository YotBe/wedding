import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  createGuest,
  deleteGuest,
  importGuests,
  listGuests,
  updateGuest,
  type GuestInput,
  type GuestWithRsvp,
} from '../../lib/admin';
import { parseCsv, toCsv, downloadCsv } from '../../lib/csv';
import { rsvpUrl, waMeLink } from '../../lib/links';
import { sendInvites } from '../../lib/whatsapp';
import type { Lang, Side } from '../../types';

type StatusFilter = 'all' | 'responded' | 'attending' | 'declined' | 'noResponse';
const SIDES: Side[] = ['bride', 'groom', 'both'];
const LANGS: Lang[] = ['he', 'en'];

const EMPTY: GuestInput = {
  full_name: '',
  phone: null,
  party_label: null,
  max_party: 1,
  side: null,
  language: 'he',
};

function rsvpStatus(g: GuestWithRsvp): StatusFilter {
  if (!g.rsvp) return 'noResponse';
  return g.rsvp.attending ? 'attending' : 'declined';
}

export default function Guests() {
  const { t } = useTranslation();
  const [guests, setGuests] = useState<GuestWithRsvp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [editing, setEditing] = useState<GuestWithRsvp | 'new' | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [linksCopied, setLinksCopied] = useState(false);
  const [sendState, setSendState] = useState<Record<string, 'sending' | 'sent' | 'failed'>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  async function reload() {
    setLoading(true);
    try {
      setGuests(await listGuests());
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return guests.filter((g) => {
      if (filter === 'responded' && !g.rsvp) return false;
      if (filter !== 'all' && filter !== 'responded' && rsvpStatus(g) !== filter) return false;
      if (!q) return true;
      return (
        g.full_name.toLowerCase().includes(q) ||
        (g.party_label ?? '').toLowerCase().includes(q) ||
        (g.phone ?? '').includes(q)
      );
    });
  }, [guests, search, filter]);

  async function handleDelete(g: GuestWithRsvp) {
    if (!window.confirm(t('admin.guests.confirmDelete', { name: g.full_name }))) return;
    await deleteGuest(g.id);
    await reload();
  }

  async function handleImport(file: File) {
    setNotice(null);
    try {
      const rows = parseCsv(await file.text()).filter((r) => r.some((c) => c.trim() !== ''));
      if (rows.length < 2) throw new Error('empty');
      const header = rows[0].map((h) => h.trim().toLowerCase());
      const idx = (name: string) => header.indexOf(name);
      const iName = idx('full_name');
      if (iName < 0) throw new Error('no full_name column');

      const payload: GuestInput[] = rows.slice(1).map((r) => {
        const sideRaw = idx('side') >= 0 ? (r[idx('side')] ?? '').trim() : '';
        const langRaw = idx('language') >= 0 ? (r[idx('language')] ?? '').trim() : '';
        const maxRaw = idx('max_party') >= 0 ? parseInt(r[idx('max_party')], 10) : NaN;
        return {
          full_name: r[iName].trim(),
          phone: idx('phone') >= 0 && r[idx('phone')]?.trim() ? r[idx('phone')].trim() : null,
          party_label:
            idx('party_label') >= 0 && r[idx('party_label')]?.trim()
              ? r[idx('party_label')].trim()
              : null,
          max_party: Number.isFinite(maxRaw) && maxRaw > 0 ? maxRaw : 1,
          side: (SIDES as string[]).includes(sideRaw) ? (sideRaw as Side) : null,
          language: (LANGS as string[]).includes(langRaw) ? (langRaw as Lang) : 'he',
        };
      }).filter((g) => g.full_name);

      const count = await importGuests(payload);
      setNotice(t('admin.guests.imported', { count }));
      await reload();
    } catch {
      setNotice(t('admin.guests.importError'));
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function handleExport() {
    const header = [
      'full_name', 'phone', 'party_label', 'max_party', 'side', 'language', 'invite_token',
      'attending', 'num_adults', 'num_kids', 'dietary', 'blessing', 'table',
    ];
    const rows = guests.map((g) => [
      g.full_name, g.phone, g.party_label, g.max_party, g.side, g.language, g.invite_token,
      g.rsvp ? (g.rsvp.attending ? 'yes' : 'no') : '',
      g.rsvp?.num_adults ?? '', g.rsvp?.num_kids ?? '', g.rsvp?.dietary ?? '',
      g.rsvp?.blessing ?? '', g.table_name ?? '',
    ]);
    downloadCsv(`guests-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(header, rows));
  }

  // Bulk "reminder workflow": copy the currently filtered guests (e.g. filtered
  // to non-responders) as "name — link" lines, ready to paste and send.
  async function copyLinks() {
    const text = filtered.map((g) => `${g.full_name} — ${rsvpUrl(g.invite_token)}`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setLinksCopied(true);
      setTimeout(() => setLinksCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  // Send WhatsApp invites (personal RSVP links) to guests who have a phone.
  async function handleSendInvites(targets: GuestWithRsvp[]) {
    const withPhone = targets.filter((g) => g.phone);
    if (withPhone.length === 0) {
      setNotice(t('admin.guests.noPhones'));
      return;
    }
    setNotice(null);
    setSendState((s) => {
      const next = { ...s };
      for (const g of withPhone) next[g.id] = 'sending';
      return next;
    });
    try {
      const results = await sendInvites(withPhone.map((g) => g.id));
      setSendState((s) => {
        const next = { ...s };
        for (const r of results) next[r.id] = r.ok ? 'sent' : 'failed';
        return next;
      });
      const ok = results.filter((r) => r.ok).length;
      setNotice(t('admin.guests.sentSummary', { ok, total: results.length }));
    } catch {
      setSendState((s) => {
        const next = { ...s };
        for (const g of withPhone) next[g.id] = 'failed';
        return next;
      });
      setNotice(t('admin.guests.sendError'));
    }
  }

  const FILTERS: StatusFilter[] = ['all', 'noResponse', 'attending', 'declined'];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl text-stone-800">{t('admin.guests.title')}</h1>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setEditing('new')}
            className="rounded-full bg-sand px-4 py-2 text-sm font-medium text-white hover:bg-sand-dark"
          >
            {t('admin.guests.add')}
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:border-sand"
          >
            {t('admin.guests.import')}
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:border-sand"
          >
            {t('admin.guests.export')}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])}
          />
        </div>
      </div>

      <p className="text-xs text-stone-400">{t('admin.guests.importHint')}</p>
      {notice && <p className="text-sm text-sand-dark">{notice}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('admin.guests.search')}
          className="min-w-[12rem] flex-1 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm focus:border-sand focus:outline-none"
        />
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1.5 text-xs transition ${
                filter === f ? 'bg-sand text-white' : 'bg-white/70 text-stone-600 hover:text-sand-dark'
              }`}
            >
              {t(`admin.filter.${f}`)}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-stone-600">{t('admin.loadError')}</p>}
      {loading ? (
        <p className="text-stone-500">{t('admin.loading')}</p>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs text-stone-400">{t('admin.guests.count', { count: filtered.length })}</p>
          {filtered.length > 0 && (
            <>
              <button
                type="button"
                onClick={copyLinks}
                className="text-xs text-stone-500 underline-offset-2 hover:text-sand-dark hover:underline"
              >
                {linksCopied ? t('admin.guests.copied') : t('admin.guests.copyLinks')}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(t('admin.guests.confirmSendList', { count: filtered.length }))) {
                    void handleSendInvites(filtered);
                  }
                }}
                className="text-xs text-green-700 underline-offset-2 hover:underline"
              >
                {t('admin.guests.sendInvitesList')}
              </button>
            </>
          )}
        </div>
      )}

      <ul className="space-y-2">
        {filtered.map((g) => (
          <GuestRow
            key={g.id}
            guest={g}
            sendStatus={sendState[g.id]}
            onSend={() => void handleSendInvites([g])}
            onEdit={() => setEditing(g)}
            onDelete={() => handleDelete(g)}
          />
        ))}
      </ul>

      {editing && (
        <GuestFormModal
          initial={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await reload();
          }}
        />
      )}
    </div>
  );
}

function GuestRow({
  guest,
  sendStatus,
  onSend,
  onEdit,
  onDelete,
}: {
  guest: GuestWithRsvp;
  sendStatus?: 'sending' | 'sent' | 'failed';
  onSend: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const status = rsvpStatus(guest);
  const badge: Record<StatusFilter, string> = {
    all: '',
    responded: '',
    attending: 'bg-green-100 text-green-700',
    declined: 'bg-red-100 text-red-700',
    noResponse: 'bg-stone-100 text-stone-500',
  };

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(rsvpUrl(guest.invite_token));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  const waText = t('admin.guests.waText', { name: guest.full_name, url: rsvpUrl(guest.invite_token) });

  return (
    <li className="rounded-2xl bg-white/70 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-stone-800">{guest.full_name}</p>
          <p className="text-xs text-stone-500">
            {guest.party_label && <span>{guest.party_label} · </span>}
            {t('admin.guests.seats', { count: guest.max_party })}
            {guest.rsvp?.attending && (
              <span> · {t('admin.guests.confirmed', {
                adults: guest.rsvp.num_adults,
                kids: guest.rsvp.num_kids,
              })}</span>
            )}
            {guest.table_name && <span> · {guest.table_name}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs ${badge[status]}`}>
            {t(`admin.filter.${status}`)}
          </span>
          <button type="button" onClick={copyLink} className="text-xs text-stone-500 hover:text-sand-dark">
            {copied ? t('admin.guests.copied') : t('admin.guests.copyLink')}
          </button>
          <a
            href={waMeLink(guest.phone, waText)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-green-700 hover:underline"
          >
            {t('admin.guests.whatsapp')}
          </a>
          <button
            type="button"
            onClick={onSend}
            disabled={!guest.phone || sendStatus === 'sending'}
            className="text-xs text-green-700 hover:underline disabled:cursor-not-allowed disabled:text-stone-300"
            title={!guest.phone ? t('admin.guests.noPhone') : undefined}
          >
            {sendStatus === 'sending'
              ? t('admin.guests.sending')
              : sendStatus === 'sent'
                ? t('admin.guests.sent')
                : sendStatus === 'failed'
                  ? t('admin.guests.sendFailed')
                  : t('admin.guests.sendInvite')}
          </button>
          <button type="button" onClick={onEdit} className="text-xs text-stone-500 hover:text-sand-dark">
            {t('admin.guests.edit')}
          </button>
          <button type="button" onClick={onDelete} className="text-xs text-red-500 hover:text-red-700">
            {t('admin.guests.delete')}
          </button>
        </div>
      </div>
    </li>
  );
}

function GuestFormModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: GuestWithRsvp | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState<GuestInput>(
    initial
      ? {
          full_name: initial.full_name,
          phone: initial.phone,
          party_label: initial.party_label,
          max_party: initial.max_party,
          side: initial.side,
          language: initial.language,
        }
      : EMPTY,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  function set<K extends keyof GuestInput>(key: K, value: GuestInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(false);
    try {
      if (initial) await updateGuest(initial.id, form);
      else await createGuest(form);
      await onSaved();
    } catch {
      setError(true);
      setBusy(false);
    }
  }

  const field = 'w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-800 focus:border-sand focus:outline-none';

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-stone-900/40 px-4"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-md space-y-4 rounded-3xl bg-cream p-6"
      >
        <h2 className="font-serif text-2xl text-stone-800">
          {t(initial ? 'admin.guests.editTitle' : 'admin.guests.addTitle')}
        </h2>

        <label className="block text-sm text-stone-600">
          {t('admin.guests.fullName')}
          <input
            className={field}
            value={form.full_name}
            onChange={(e) => set('full_name', e.target.value)}
            required
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm text-stone-600">
            {t('admin.guests.phone')}
            <input
              className={field}
              value={form.phone ?? ''}
              onChange={(e) => set('phone', e.target.value || null)}
              placeholder="+972…"
            />
          </label>
          <label className="block text-sm text-stone-600">
            {t('admin.guests.maxParty')}
            <input
              type="number"
              min={1}
              className={field}
              value={form.max_party}
              onChange={(e) => set('max_party', Math.max(1, parseInt(e.target.value, 10) || 1))}
            />
          </label>
        </div>

        <label className="block text-sm text-stone-600">
          {t('admin.guests.partyLabel')}
          <input
            className={field}
            value={form.party_label ?? ''}
            onChange={(e) => set('party_label', e.target.value || null)}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm text-stone-600">
            {t('admin.guests.side')}
            <select
              className={field}
              value={form.side ?? ''}
              onChange={(e) => set('side', (e.target.value || null) as Side | null)}
            >
              <option value="">—</option>
              {SIDES.map((s) => (
                <option key={s} value={s}>
                  {t(`admin.side.${s}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-stone-600">
            {t('admin.guests.language')}
            <select
              className={field}
              value={form.language}
              onChange={(e) => set('language', e.target.value as Lang)}
            >
              {LANGS.map((l) => (
                <option key={l} value={l}>
                  {t(`admin.lang.${l}`)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{t('admin.guests.saveError')}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="rounded-full px-5 py-2 text-sm text-stone-600">
            {t('admin.guests.cancel')}
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-sand px-6 py-2 text-sm font-medium text-white hover:bg-sand-dark disabled:opacity-60"
          >
            {t('admin.guests.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
