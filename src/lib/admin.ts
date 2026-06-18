import { supabase } from './supabase';
import { generateInviteToken } from './token';
import type { Guest, Rsvp, Side, Lang } from '../types';

// A guest row joined with its rsvp (and assigned table, if any) — the
// shape the admin guest list / RSVP tracker works with.
export interface GuestWithRsvp extends Guest {
  rsvp: Rsvp | null;
  table_name: string | null;
  table_id: string | null;
  seats: number | null;
}

const SELECT = '*, rsvps(*), seat_assignments(seats, table_id, tables(name))';

// PostgREST returns embedded resources as arrays; normalise to single values.
interface RawGuest extends Guest {
  rsvps: Rsvp[] | null;
  seat_assignments: { seats: number; table_id: string; tables: { name: string } | null }[] | null;
}

function normalise(raw: RawGuest): GuestWithRsvp {
  const { rsvps, seat_assignments, ...guest } = raw;
  const assignment = seat_assignments?.[0] ?? null;
  return {
    ...guest,
    rsvp: rsvps?.[0] ?? null,
    table_name: assignment?.tables?.name ?? null,
    table_id: assignment?.table_id ?? null,
    seats: assignment?.seats ?? null,
  };
}

/** Whether the current session belongs to an allowlisted admin. */
export async function checkIsAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_admin');
  if (error) return false;
  return Boolean(data);
}

export async function listGuests(): Promise<GuestWithRsvp[]> {
  const { data, error } = await supabase
    .from('guests')
    .select(SELECT)
    .order('full_name');
  if (error) throw error;
  return (data as unknown as RawGuest[]).map(normalise);
}

export interface GuestInput {
  full_name: string;
  phone: string | null;
  party_label: string | null;
  max_party: number;
  side: Side | null;
  language: Lang;
}

export async function createGuest(input: GuestInput): Promise<void> {
  const { error } = await supabase
    .from('guests')
    .insert({ ...input, invite_token: generateInviteToken() });
  if (error) throw error;
}

export async function updateGuest(id: string, input: GuestInput): Promise<void> {
  const { error } = await supabase.from('guests').update(input).eq('id', id);
  if (error) throw error;
}

export async function deleteGuest(id: string): Promise<void> {
  const { error } = await supabase.from('guests').delete().eq('id', id);
  if (error) throw error;
}

/** Bulk insert imported guests, generating a token for each. */
export async function importGuests(rows: GuestInput[]): Promise<number> {
  const payload = rows.map((r) => ({ ...r, invite_token: generateInviteToken() }));
  const { data, error } = await supabase.from('guests').insert(payload).select('id');
  if (error) throw error;
  return data?.length ?? 0;
}
