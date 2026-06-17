import { supabase } from './supabase';
import type { InviteData, InviteRsvp } from '../types';

/** Load an invite (guest + existing rsvp + assigned table) by its token. */
export async function getInvite(token: string): Promise<InviteData | null> {
  const { data, error } = await supabase.rpc('get_invite', { p_token: token });
  if (error) throw error;
  return (data as InviteData | null) ?? null;
}

export interface SubmitRsvpInput {
  token: string;
  attending: boolean;
  numAdults: number;
  numKids: number;
  dietary: string | null;
  blessing: string | null;
}

/** Upsert the rsvp for the guest owning the token. Returns the stored rsvp. */
export async function submitRsvp(input: SubmitRsvpInput): Promise<InviteRsvp> {
  const { data, error } = await supabase.rpc('submit_rsvp', {
    p_token: input.token,
    p_attending: input.attending,
    p_adults: input.numAdults,
    p_kids: input.numKids,
    p_dietary: input.dietary,
    p_blessing: input.blessing,
  });
  if (error) throw error;
  return data as InviteRsvp;
}
