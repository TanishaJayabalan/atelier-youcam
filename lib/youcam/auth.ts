import crypto from 'crypto';

interface CachedToken {
  accessToken: string;
  expiresAt: number; // timestamp in milliseconds
}

const tokenCacheMap = new Map<string, CachedToken>();
const inflightAuthMap = new Map<string, Promise<string>>();

/**
 * Normalizes PEM key format to ensure valid RSA public key formatting.
 */
export function formatPublicKeyPem(rawKey: string): string {
  let key = rawKey.trim();

  // If newlines are escaped as \n strings, unescape them
  if (key.includes('\\n')) {
    key = key.replace(/\\n/g, '\n');
  }

  // If it already has standard PEM headers, return trimmed
  if (key.startsWith('-----BEGIN') && key.includes('-----END')) {
    return key;
  }

  // Otherwise, wrap it in standard X.509 RSA public key header/footer
  const cleanBase64 = key.replace(/[\r\n\s]/g, '');
  const lines = cleanBase64.match(/.{1,64}/g)?.join('\n') || cleanBase64;
  return `-----BEGIN PUBLIC KEY-----\n${lines}\n-----END PUBLIC KEY-----`;
}

/**
 * Generates an encrypted id_token for Perfect Corp YouCam S2S Auth.
 * Format: client_id=<CLIENT_ID>&timestamp=<epoch_ms> encrypted with RSA PKCS#1 padding.
 */
export function generateIdToken(clientId: string, clientSecretPem: string, timestamp: number = Date.now()): string {
  const plaintext = `client_id=${clientId}&timestamp=${timestamp}`;
  const formattedKey = formatPublicKeyPem(clientSecretPem);

  const encryptedBuffer = crypto.publicEncrypt(
    {
      key: formattedKey,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    },
    Buffer.from(plaintext, 'utf8')
  );

  return encryptedBuffer.toString('base64');
}

export interface YouCamCredentials {
  clientId?: string;
  clientSecret?: string;
}

/**
 * Obtains a verified YouCam bearer access_token from the S2S Auth endpoint.
 * Supports custom user credentials as well as environment variable fallbacks.
 */
export async function getAccessToken(
  forceRefresh = false,
  credentials?: YouCamCredentials
): Promise<string> {
  const now = Date.now();
  const REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes buffer before 2-hour expiry

  const clientId = credentials?.clientId || process.env.YOUCAM_CLIENT_ID;
  const clientSecret = credentials?.clientSecret || process.env.YOUCAM_CLIENT_SECRET;
  const apiBase = (process.env.YOUCAM_API_BASE || 'https://yce-api-01.makeupar.com').replace(/\/+$/, '');

  if (!clientId || !clientSecret) {
    throw new Error('Missing YouCam API credentials. Please configure your Client ID & Secret in API Settings.');
  }

  const cacheKey = clientId;
  const cached = tokenCacheMap.get(cacheKey);

  if (!forceRefresh && cached && cached.expiresAt > now + REFRESH_BUFFER_MS) {
    return cached.accessToken;
  }

  if (inflightAuthMap.has(cacheKey)) {
    return inflightAuthMap.get(cacheKey)!;
  }

  const authPromise = (async () => {
    const idToken = generateIdToken(clientId, clientSecret, now);
    const authUrl = `${apiBase}/s2s/v1.0/client/auth`;

    const response = await fetch(authUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        id_token: idToken,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`YouCam S2S auth failed: HTTP ${response.status} — ${errText}`);
    }

    const data = await response.json();
    const token = data?.result?.access_token || data?.data?.access_token || data?.access_token;
    if (!token) {
      throw new Error(`YouCam auth response missing access_token: ${JSON.stringify(data)}`);
    }

    // YouCam S2S access tokens are valid for 2 hours (7200s)
    tokenCacheMap.set(cacheKey, {
      accessToken: token,
      expiresAt: now + 2 * 60 * 60 * 1000,
    });
    return token;
  })().finally(() => {
    inflightAuthMap.delete(cacheKey);
  });

  inflightAuthMap.set(cacheKey, authPromise);
  return authPromise;
}

/**
 * Resets the in-memory token cache (useful for tests).
 */
export function resetTokenCache(): void {
  tokenCacheMap.clear();
  inflightAuthMap.clear();
}
