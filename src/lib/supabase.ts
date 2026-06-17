import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env (see .env.example).',
  );
}

// Anon client only. Guest-facing data is read/written exclusively through
// SECURITY DEFINER RPCs (get_invite / submit_rsvp / find_table) — never by
// querying the tables directly. The service-role key is NEVER used here.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
