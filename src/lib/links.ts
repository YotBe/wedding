/** Absolute URL to a guest's personal RSVP page. */
export function rsvpUrl(token: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/rsvp/${token}`;
}

/**
 * wa.me share link with prefilled text. Phone is optional — without it the
 * link just opens WhatsApp with the message ready to send to a chosen contact.
 */
export function waMeLink(phone: string | null, text: string): string {
  const digits = (phone ?? '').replace(/\D/g, '');
  const base = digits ? `https://wa.me/${digits}` : 'https://wa.me/';
  return `${base}?text=${encodeURIComponent(text)}`;
}
