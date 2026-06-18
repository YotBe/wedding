import { supabase } from './supabase';
import type { SeatingTable } from '../types';

export interface TableInput {
  name: string;
  capacity: number;
  zone: string | null;
  notes: string | null;
}

export async function listTables(): Promise<SeatingTable[]> {
  const { data, error } = await supabase.from('tables').select('*').order('name');
  if (error) throw error;
  return data as SeatingTable[];
}

export async function createTable(input: TableInput): Promise<void> {
  const { error } = await supabase.from('tables').insert(input);
  if (error) throw error;
}

export async function updateTable(id: string, input: TableInput): Promise<void> {
  const { error } = await supabase.from('tables').update(input).eq('id', id);
  if (error) throw error;
}

export async function deleteTable(id: string): Promise<void> {
  const { error } = await supabase.from('tables').delete().eq('id', id);
  if (error) throw error;
}

/** Assign (or move) a guest's party to a table. One assignment per guest. */
export async function assignGuest(guestId: string, tableId: string, seats: number): Promise<void> {
  const { error } = await supabase
    .from('seat_assignments')
    .upsert({ guest_id: guestId, table_id: tableId, seats }, { onConflict: 'guest_id' });
  if (error) throw error;
}

export async function unassignGuest(guestId: string): Promise<void> {
  const { error } = await supabase.from('seat_assignments').delete().eq('guest_id', guestId);
  if (error) throw error;
}

/** Seats a party needs: confirmed headcount if attending, else the invite size. */
export function seatsNeeded(g: { rsvp: { attending: boolean; num_adults: number; num_kids: number } | null; max_party: number }): number {
  if (g.rsvp?.attending) return Math.max(1, g.rsvp.num_adults + g.rsvp.num_kids);
  return Math.max(1, g.max_party);
}
