// Application types mirroring the Postgres schema (supabase/migrations/0001_init.sql).

export type Lang = 'he' | 'en';
export type Side = 'bride' | 'groom' | 'both';
export type DietaryKind = 'none' | 'vegetarian' | 'vegan' | 'other';

export interface Guest {
  id: string;
  full_name: string;
  phone: string | null;
  invite_token: string;
  party_label: string | null;
  max_party: number;
  side: Side | null;
  language: Lang;
  created_at: string;
}

export interface Rsvp {
  id: string;
  guest_id: string;
  attending: boolean;
  num_adults: number;
  num_kids: number;
  dietary: string | null;
  blessing: string | null;
  responded_at: string;
}

export interface SeatingTable {
  id: string;
  name: string;
  capacity: number;
  zone: string | null;
  notes: string | null;
}

export interface SeatAssignment {
  id: string;
  guest_id: string;
  table_id: string;
  seats: number;
  created_at: string;
}

export interface Admin {
  email: string;
}
