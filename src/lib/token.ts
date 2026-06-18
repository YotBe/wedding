// URL-safe, hard-to-guess invite token. ~22 chars of base36 from 16 random
// bytes — plenty of entropy for per-guest links, short enough for WhatsApp.
export function generateInviteToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let out = '';
  for (const b of bytes) out += b.toString(36).padStart(2, '0');
  return out;
}
