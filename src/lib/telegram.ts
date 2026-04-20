// src/lib/telegram.ts
// Usage: import { validateInitData } from '$lib/telegram'

export async function validateInitData(
  initData: string,
  botToken: string,
  maxAgeSeconds = 86_400
): Promise<{ ok: boolean; error?: string; data?: Record<string, string> }> {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');

  if (!hash) return { ok: false, error: 'Missing hash' };
  params.delete('hash');

  const authDate = Number(params.get('auth_date'));
  if (!authDate) return { ok: false, error: 'Missing auth_date' };

  const age = Math.floor(Date.now() / 1000) - authDate;
  if (age > maxAgeSeconds) return { ok: false, error: 'initData expired' };

  const checkString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const enc = (s: string) => new TextEncoder().encode(s);

  const secretKey = await crypto.subtle.importKey('raw', enc('WebAppData'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    .then(k => crypto.subtle.sign('HMAC', k, enc(botToken)))
    .then(buf => crypto.subtle.importKey('raw', buf, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']));

  const sig = await crypto.subtle.sign('HMAC', secretKey, enc(checkString));
  const computed = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');

  if (computed !== hash.toLowerCase()) return { ok: false, error: 'Invalid hash' };

  return { ok: true, data: Object.fromEntries(params) };
}