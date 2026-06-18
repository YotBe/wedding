import { supabase } from './supabase';
import type { InviteTable } from '../types';

/** Look up a guest's table by name. Returns null for no/ambiguous match. */
export async function findTable(name: string): Promise<InviteTable | null> {
  const { data, error } = await supabase.rpc('find_table', { p_name: name });
  if (error) throw error;
  return (data as InviteTable | null) ?? null;
}
