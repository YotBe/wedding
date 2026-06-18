# WhatsApp (Twilio) — Edge Functions

Outbound WhatsApp via Twilio. Twilio credentials live **only** as Edge Function
secrets — never in the browser.

| Function | Trigger | Auth | Purpose |
|---|---|---|---|
| `send-invite` | Admin clicks "Send invite" / "Send invites to list" | admin JWT (verifies `is_admin`) | Sends each guest their personal RSVP link |
| `notify-rsvp` | RSVP page, after a guest submits (best-effort) | none (token-scoped) | Messages the couple with the response + headcount |

## Required secrets

Set these on the Supabase project (Dashboard → Edge Functions → Secrets, or
`supabase secrets set KEY=value`):

```
TWILIO_ACCOUNT_SID      = ACxxxxxxxx
TWILIO_AUTH_TOKEN       = your_auth_token
TWILIO_WHATSAPP_FROM    = whatsapp:+14155238886   # your Twilio WhatsApp sender (sandbox or approved number)
SITE_URL                = https://your-domain.com  # used to build /rsvp/<token> links
COUPLE_WHATSAPP_TO      = whatsapp:+9725XXXXXXXX    # where the live RSVP feed is sent
```

Optional — for production business-initiated invites (outside the 24h window,
WhatsApp requires an **approved template**):

```
TWILIO_INVITE_CONTENT_SID = HXxxxxxxxx   # template with vars {{1}}=name, {{2}}=rsvp url
```

When `TWILIO_INVITE_CONTENT_SID` is unset, invites are sent as plain text — fine
for the Twilio **sandbox** and within an open 24h conversation window.

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are injected
automatically by the platform.

## Deploy

```
supabase functions deploy send-invite
supabase functions deploy notify-rsvp --no-verify-jwt
```

(`notify-rsvp` runs with JWT verification disabled because guests are anonymous;
it only ever reveals the single guest tied to a valid invite token, and only to
`COUPLE_WHATSAPP_TO`.)

## Testing with the Twilio sandbox

1. In Twilio Console → Messaging → Try it out → WhatsApp sandbox, join the
   sandbox from your phone (send the join code to the sandbox number).
2. Set the secrets above (use the sandbox number as `TWILIO_WHATSAPP_FROM`).
3. Add yourself as a guest with your phone in E.164 (e.g. `+9725...`), then hit
   "Send invite" in `/admin/guests`. Submit an RSVP to see the couple feed.
