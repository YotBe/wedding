// notify-rsvp — WhatsApp a live RSVP feed to the couple via Twilio.
//
// POST { token: string }  — invoked (best-effort) by the RSVP page right after
// a guest submits. Looks the guest + their rsvp up by token with the service
// role, then messages the couple with the response and headcount. Returns 200
// even on no-op so it never blocks the guest's confirmation.
//
// Required secrets:
//   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM
//   COUPLE_WHATSAPP_TO  — the couple's number (e.g. whatsapp:+9725… or +9725…)
//
// verify_jwt is disabled: guests are anonymous. The endpoint only ever reveals
// the single guest tied to a valid token, and only to the couple's number.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

function toWhatsApp(value: string): string {
  if (value.startsWith('whatsapp:')) return value;
  const cleaned = value.replace(/[^\d+]/g, '');
  return `whatsapp:${cleaned.startsWith('+') ? cleaned : `+${cleaned}`}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { token } = await req.json().catch(() => ({ token: null }));
    if (!token) return json({ error: 'no_token' }, 400);

    const coupleTo = Deno.env.get('COUPLE_WHATSAPP_TO');
    const sid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const from = Deno.env.get('TWILIO_WHATSAPP_FROM');
    // Not configured yet → quietly no-op so the RSVP flow is unaffected.
    if (!coupleTo || !sid || !authToken || !from) return json({ ok: false, skipped: 'not_configured' });

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { data: guest } = await admin
      .from('guests')
      .select('full_name, party_label, rsvps(attending, num_adults, num_kids)')
      .eq('invite_token', token)
      .maybeSingle();

    const rsvp = (guest as { rsvps?: { attending: boolean; num_adults: number; num_kids: number }[] } | null)
      ?.rsvps?.[0];
    if (!guest || !rsvp) return json({ ok: false, skipped: 'no_rsvp' });

    const name = (guest as { party_label?: string | null; full_name: string }).party_label ||
      (guest as { full_name: string }).full_name;
    const body = rsvp.attending
      ? `✅ ${name} אישרו הגעה — ${rsvp.num_adults} מבוגרים, ${rsvp.num_kids} ילדים (סה״כ ${rsvp.num_adults + rsvp.num_kids}).`
      : `❌ ${name} לא יוכלו להגיע.`;

    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + btoa(`${sid}:${authToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ From: from, To: toWhatsApp(coupleTo), Body: body }).toString(),
    });
    if (!res.ok) throw new Error(`Twilio ${res.status}: ${await res.text()}`);

    return json({ ok: true });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
