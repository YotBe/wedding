import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { listGuests, type GuestWithRsvp } from '../../lib/admin';
import {
  assignGuest,
  createTable,
  deleteTable,
  listTables,
  seatsNeeded,
  unassignGuest,
  updateTable,
  type TableInput,
} from '../../lib/seating';
import type { SeatingTable } from '../../types';

export default function Seating() {
  const { t } = useTranslation();
  const [guests, setGuests] = useState<GuestWithRsvp[]>([]);
  const [tables, setTables] = useState<SeatingTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState<SeatingTable | 'new' | null>(null);

  async function reload() {
    setLoading(true);
    try {
      const [g, ts] = await Promise.all([listGuests(), listTables()]);
      setGuests(g);
      setTables(ts);
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

  // Seats currently assigned per table (summed from the guest assignments).
  const fill = useMemo(() => {
    const map = new Map<string, number>();
    for (const g of guests) {
      if (g.table_id) map.set(g.table_id, (map.get(g.table_id) ?? 0) + (g.seats ?? 0));
    }
    return map;
  }, [guests]);

  const unassigned = guests.filter((g) => !g.table_id);

  async function handleAssign(g: GuestWithRsvp, tableId: string) {
    if (tableId === '') await unassignGuest(g.id);
    else await assignGuest(g.id, tableId, seatsNeeded(g));
    await reload();
  }

  async function handleDeleteTable(table: SeatingTable) {
    if (fill.get(table.id)) {
      window.alert(t('admin.seating.tableNotEmpty'));
      return;
    }
    if (!window.confirm(t('admin.seating.confirmDelete', { name: table.name }))) return;
    await deleteTable(table.id);
    await reload();
  }

  if (error) return <p className="text-stone-600">{t('admin.loadError')}</p>;
  if (loading) return <p className="text-stone-500">{t('admin.loading')}</p>;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl text-stone-800">{t('admin.seating.title')}</h1>
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="rounded-full bg-sand px-4 py-2 text-sm font-medium text-white hover:bg-sand-dark"
        >
          {t('admin.seating.addTable')}
        </button>
      </div>

      {/* Tables overview */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tables.map((table) => {
          const used = fill.get(table.id) ?? 0;
          const over = used > table.capacity;
          return (
            <div key={table.id} className="rounded-2xl bg-white/70 px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-stone-800">{table.name}</p>
                  {table.zone && <p className="text-xs text-stone-500">{table.zone}</p>}
                </div>
                <div className="flex gap-2 text-xs">
                  <button onClick={() => setEditing(table)} className="text-stone-500 hover:text-sand-dark">
                    {t('admin.guests.edit')}
                  </button>
                  <button onClick={() => void handleDeleteTable(table)} className="text-red-500 hover:text-red-700">
                    {t('admin.guests.delete')}
                  </button>
                </div>
              </div>
              <p className={`mt-2 text-sm ${over ? 'font-medium text-red-600' : 'text-stone-600'}`}>
                {t('admin.seating.fill', { used, capacity: table.capacity })}
                {over && ` · ${t('admin.seating.over')}`}
              </p>
            </div>
          );
        })}
        {tables.length === 0 && <p className="text-sm text-stone-500">{t('admin.seating.noTables')}</p>}
      </section>

      {/* Assignment list */}
      <section>
        <h2 className="mb-3 font-medium text-stone-700">
          {t('admin.seating.unassignedCount', { count: unassigned.length })}
        </h2>
        <ul className="space-y-2">
          {guests.map((g) => (
            <li
              key={g.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/70 px-4 py-2.5"
            >
              <div className="min-w-0">
                <span className="font-medium text-stone-800">{g.full_name}</span>
                <span className="ms-2 text-xs text-stone-500">
                  {t('admin.seating.seats', { count: seatsNeeded(g) })}
                  {!g.rsvp && ` · ${t('admin.filter.noResponse')}`}
                  {g.rsvp && !g.rsvp.attending && ` · ${t('admin.filter.declined')}`}
                </span>
              </div>
              <select
                value={g.table_id ?? ''}
                onChange={(e) => void handleAssign(g, e.target.value)}
                className="rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-sm focus:border-sand focus:outline-none"
              >
                <option value="">{t('admin.seating.unassigned')}</option>
                {tables.map((tbl) => (
                  <option key={tbl.id} value={tbl.id}>
                    {tbl.name}
                  </option>
                ))}
              </select>
            </li>
          ))}
        </ul>
        {guests.length === 0 && <p className="text-sm text-stone-500">{t('admin.seating.noGuests')}</p>}
      </section>

      {editing && (
        <TableFormModal
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

function TableFormModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: SeatingTable | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState<TableInput>(
    initial
      ? { name: initial.name, capacity: initial.capacity, zone: initial.zone, notes: initial.notes }
      : { name: '', capacity: 10, zone: null, notes: null },
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(false);
    try {
      if (initial) await updateTable(initial.id, form);
      else await createTable(form);
      await onSaved();
    } catch {
      setError(true);
      setBusy(false);
    }
  }

  const field = 'w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-800 focus:border-sand focus:outline-none';

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-stone-900/40 px-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-md space-y-4 rounded-3xl bg-cream p-6"
      >
        <h2 className="font-serif text-2xl text-stone-800">
          {t(initial ? 'admin.seating.editTable' : 'admin.seating.addTable')}
        </h2>
        <label className="block text-sm text-stone-600">
          {t('admin.seating.tableName')}
          <input className={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm text-stone-600">
            {t('admin.seating.capacity')}
            <input
              type="number"
              min={1}
              className={field}
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: Math.max(1, parseInt(e.target.value, 10) || 1) })}
            />
          </label>
          <label className="block text-sm text-stone-600">
            {t('admin.seating.zone')}
            <input className={field} value={form.zone ?? ''} onChange={(e) => setForm({ ...form, zone: e.target.value || null })} />
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
