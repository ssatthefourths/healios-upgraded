/**
 * Password hashing + verification.
 *
 * Algorithm: PBKDF2-SHA256 (only OWASP-recommended hasher natively available
 * in the Cloudflare Workers WebCrypto API — bcrypt/argon2 aren't).
 *
 * Storage format (self-describing so iteration count can be raised later):
 *   pbkdf2$<iterations>$<base64-salt>$<base64-hash>
 *
 * Legacy format (pre-H1): bare 64-char hex SHA-256 digest. The hybrid verifier
 * accepts either; on successful legacy verification the caller should re-hash
 * with PBKDF2 and update the row ("upgrade-on-next-login").
 *
 * Iteration count: 100,000. Below OWASP's 600,000 recommendation but ~150,000×
 * the cost of a bare SHA-256 and fits inside Workers' 10ms free-tier CPU
 * budget (measured ~2-4ms per hash). Raise once the account is on paid Workers.
 */

// TODO(H2): raise to 600_000 when the account moves to paid Workers (the
// free-tier 10ms CPU budget is the only reason we're below OWASP's 2024
// recommendation). The verifier already accepts any iteration count in the
// 1_000–10_000_000 range, so this is a one-constant bump with no migration.
// See docs/SECURITY.md "Password storage" for the full rationale.
const ITERATIONS = 100_000;
const SALT_BYTES = 16;
const HASH_BYTES = 32;

function toBase64(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function fromBase64(b64: string): Uint8Array | null {
  try {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) return new Uint8Array();
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

/**
 * Byte-by-byte XOR compare that does not short-circuit on first mismatch.
 * Length mismatch returns false immediately — safe for us because both inputs
 * are always fixed-length (PBKDF2 32-byte output; legacy SHA-256 32-byte output).
 * Any length mismatch means the stored hash itself is corrupted (DB-integrity
 * issue, not a password-probing vector).
 */
export function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function pbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    key,
    HASH_BYTES * 8
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await pbkdf2(password, salt, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${toBase64(salt)}$${toBase64(hash)}`;
}

async function legacySha256Hex(password: string): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  return new Uint8Array(digest);
}

/**
 * Verify a plaintext password against a stored hash. Accepts both the new
 * PBKDF2 format and the legacy bare-hex SHA-256. Constant-time.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!stored) return false;

  if (stored.startsWith('pbkdf2$')) {
    const parts = stored.split('$');
    if (parts.length !== 4) return false;
    const iters = parseInt(parts[1], 10);
    if (!Number.isFinite(iters) || iters < 1000 || iters > 10_000_000) return false;
    const salt = fromBase64(parts[2]);
    const expected = fromBase64(parts[3]);
    if (!salt || !expected || expected.length !== HASH_BYTES) return false;
    const actual = await pbkdf2(password, salt, iters);
    return constantTimeEqual(actual, expected);
  }

  // Legacy: bare 64-char hex SHA-256 digest.
  if (/^[0-9a-f]{64}$/i.test(stored)) {
    const actual = await legacySha256Hex(password);
    const expected = fromHex(stored);
    if (expected.length !== HASH_BYTES) return false;
    return constantTimeEqual(actual, expected);
  }

  return false;
}

/** True if the stored hash is in the old SHA-256 format and should be rotated. */
export function needsRehash(stored: string): boolean {
  return !!stored && !stored.startsWith('pbkdf2$');
}

/**
 * Reject weak/common passwords at server side. UI validators can be bypassed;
 * this can't. Generic error message is returned to the caller so a sign-up
 * attacker can't tune against the blocklist.
 */
const COMMON_PASSWORDS: ReadonlySet<string> = new Set([
  'password', 'password1', 'password12', 'password123', 'password1234',
  'welcome', 'welcome1', 'welcome123', 'letmein', 'letmein1',
  'qwerty', 'qwerty123', 'qwertyuiop', 'asdfgh', 'asdfghjkl', 'zxcvbn',
  'iloveyou', 'admin', 'admin123', 'administrator', 'root', 'toor',
  'healios', 'healios1', 'healios123', 'thehealios',
  '123456', '1234567', '12345678', '123456789', '1234567890',
  'abc123', 'abcd1234', 'abcdef', 'abcdefg',
  'monkey', 'dragon', 'master', 'sunshine', 'princess', 'football', 'baseball',
  'trustno1', 'passw0rd', 'p@ssword', 'p@ssw0rd',
]);

export function checkPasswordStrength(password: string): { ok: true } | { ok: false; reason: string } {
  if (typeof password !== 'string') {
    return { ok: false, reason: 'Password is required' };
  }
  if (password.length < 10) {
    return { ok: false, reason: 'Password must be at least 10 characters' };
  }
  if (password.length > 256) {
    return { ok: false, reason: 'Password is too long' };
  }

  const lower = password.toLowerCase();

  if (COMMON_PASSWORDS.has(lower)) {
    return { ok: false, reason: 'Password is too common — please choose something harder to guess' };
  }

  // Reject "<common> + digits/year" patterns (e.g. Healios2026, password2025, admin123).
  const stripped = lower.replace(/[^a-z]/g, '');
  if (COMMON_PASSWORDS.has(stripped)) {
    return { ok: false, reason: 'Password is too common — please choose something harder to guess' };
  }
  for (const base of ['healios', 'thehealios', 'password', 'welcome', 'admin', 'qwerty', 'letmein']) {
    if (lower.includes(base)) {
      return { ok: false, reason: 'Password is too common — please choose something harder to guess' };
    }
  }

  // Reject all-same-character and obvious sequences.
  if (/^(.)\1+$/.test(password)) {
    return { ok: false, reason: 'Password is too common — please choose something harder to guess' };
  }
  if (/^(0123456789|1234567890|abcdefghij)/i.test(password)) {
    return { ok: false, reason: 'Password is too common — please choose something harder to guess' };
  }

  return { ok: true };
}
