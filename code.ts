import crypto from 'crypto';

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function hashToBase32(buf: Buffer, len = 8) {
  let bits = '';
  for (const b of buf) bits += b.toString(2).padStart(8, '0');

  let out = '';
  for (let i = 0; i < bits.length; i += 5) {
    const idx = parseInt(bits.slice(i, i + 5), 2);
    out += ALPHABET[idx % ALPHABET.length];
    if (out.length === len) break;
  }
  return out;
}

export function securityCode(childId: string, serviceDate: string, salt = process.env.CODE_SALT!) {
  const h = crypto
    .createHash('sha256')
    .update(`${childId}|${serviceDate}|${salt}`, 'utf8')
    .digest();
  return hashToBase32(h, 8);
}