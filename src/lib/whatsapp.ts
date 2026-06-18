import { supabase } from './supabase';

export interface InviteResult {
  id: string;
  ok: boolean;
  reason?: string;
}

/** Admin: send WhatsApp invites (personal RSVP links) to the given guests. */
export async function sendInvites(guestIds: string[]): Promise<InviteResult[]> {
  const { data, error } = await supabase.functions.invoke('send-invite', {
    body: { guest_ids: guestIds },
  });
  if (error) throw error;
  return (data as { results: InviteResult[] }).results;
}

/**
 * Best-effort: nudge the couple's WhatsApp feed after a guest RSVPs. Never
 * throws — a notification failure must not affect the guest's confirmation.
 */
export async function notifyRsvp(token: string): Promise<void> {
  try {
    await supabase.functions.invoke('notify-rsvp', { body: { token } });
  } catch {
    /* ignore */
  }
}
