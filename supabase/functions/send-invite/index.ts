// send-invite — admin-triggered WhatsApp invites via Twilio.
//
// POST { guest_ids: string[] }  (Authorization: the admin's Supabase JWT)
// Verifies the caller is an allowlisted admin (is_admin RPC), then sends each
// guest their personal RSVP link over WhatsApp. Twilio credentials live only
// in this function's secrets — never in the browser.
//
// Required secrets:
//   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM (e.g. whatsapp:+14155238886)
//   SITE_URL (e.g. https://your-domain.com)  — used to build the RSVP link
// Optional:
//   TWILIO_INVITE_CONTENT_SID — an approved WhatsApp template (ContentSid) for
//   business-initiated messages; variables {{1}}=name, {{2}}=rsvp url. When
//   unset, a plain text body is sent (works in the Twilio sandbox / 24h window).

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

function inviteBody(name: string, language: string, url: string): string {
  if (language === 'en') {
    return `Hi ${name}! You're invited to Neta & Yotam's wedding on 18 Sep 2026. We'd love to know if you can make it — please RSVP here: ${url}`;
  }
  return `שלום ${name}! הוזמנתם לחתונה של נטע ויותם בתאריך 18.9.2026. נשמח לדעת אם תוכלו להגיע — לאישור הגעה: ${url}`;
}

async function sendWhatsApp(
  sid: string,
  token: string,
  payload: Record<string, string>,
): Promise<void> {
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + btoa(`${sid}:${token}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(payload).toString(),
  });
  if (!res.ok) throw new Error(`Twilio ${res.status}: ${await res.text()}`);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const authHeader = req.headers.get('Authorization') ?? '';

    // Gate on admin: run is_admin() as the caller via their JWT + RLS.
    const caller = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: isAdmin } = await caller.rpc('is_admin');
    if (!isAdmin) return json({ error: 'forbidden' }, 403);

    const { guest_ids } = await req.json().catch(() => ({ guest_ids: null }));
    if (!Array.isArray(guest_ids) || guest_ids.length === 0) {
      return json({ error: 'no_guests' }, 400);
    }

    const sid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const token = Deno.env.get('TWILIO_AUTH_TOKEN');
    const from = Deno.env.get('TWILIO_WHATSAPP_FROM');
    const siteUrl = Deno.env.get('SITE_URL');
    if (!sid || !token || !from || !siteUrl) return json({ error: 'twilio_not_configured' }, 500);
    const contentSid = Deno.env.get('TWILIO_INVITE_CONTENT_SID') || '';

    // Service role to read phone numbers (RLS would otherwise hide them here).
    const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: guests, error } = await admin
      .from('guests')
      .select('id, full_name, party_label, phone, invite_token, language')
      .in('id', guest_ids);
    if (error) throw error;

    const results: { id: string; ok: boolean; reason?: string }[] = [];
    for (const g of guests ?? []) {
      if (!g.phone) {
        results.push({ id: g.id, ok: false, reason: 'no_phone' });
        continue;
      }
      const url = `${siteUrl.replace(/\/$/, '')}/rsvp/${g.invite_token}`;
      const name = g.party_label || g.full_name;
      const base = { From: from, To: toWhatsApp(g.phone) };
      const payload = contentSid
        ? { ...base, ContentSid: contentSid, ContentVariables: JSON.stringify({ '1': name, '2': url }) }
        : { ...base, Body: inviteBody(name, g.language, url) };
      try {
        await sendWhatsApp(sid, token, payload);
        results.push({ id: g.id, ok: true });
      } catch (e) {
        results.push({ id: g.id, ok: false, reason: e instanceof Error ? e.message : String(e) });
      }
    }

    return json({ results });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
