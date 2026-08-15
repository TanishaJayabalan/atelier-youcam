import crypto from 'crypto';

interface CachedToken {
  accessToken: string;
  expiresAt: number; // timestamp in milliseconds
}

let tokenCache: CachedToken | null = null;
let inflightAuthPromise: Promise<string> | null = null;

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

/**
 * Obtains a YouCam bearer access_token from the S2S Auth endpoint or directly uses API key.
 * Caches the token in memory and proactively refreshes 5 minutes before expiration.
 */
export async function getAccessToken(forceRefresh = false): Promise<string> {
  const now = Date.now();
  const REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes before 2-hour expiry

  if (!forceRefresh && tokenCache && tokenCache.expiresAt > now + REFRESH_BUFFER_MS) {
    return tokenCache.accessToken;
  }

  // Prevent multiple concurrent auth requests
  if (inflightAuthPromise) {
    return inflightAuthPromise;
  }

  inflightAuthPromise = (async () => {
    const clientId = process.env.YOUCAM_CLIENT_ID;
    const clientSecret = process.env.YOUCAM_CLIENT_SECRET;
    const apiBase = (process.env.YOUCAM_API_BASE || 'https://yce-api-01.makeupar.com').replace(/\/+$/, '');

    if (!clientId) {
      throw new Error(
        'Missing YouCam API credentials. Please set YOUCAM_CLIENT_ID in .env.local'
      );
    }

    // Support mock mode for local testing without real Perfect Corp keys
    if (clientId === 'mock_client_id' || !clientSecret || clientSecret.startsWith('mock_')) {
      // If clientSecret is empty or simple key, return clientId directly as Bearer token (Standard API Key Mode)
      if (clientId && clientId !== 'mock_client_id') {
        tokenCache = {
          accessToken: clientId,
          expiresAt: now + 24 * 60 * 60 * 1000,
        };
        return clientId;
      }
      const mockToken = `mock_youcam_token_${Date.now()}`;
      tokenCache = {
        accessToken: mockToken,
        expiresAt: now + 2 * 60 * 60 * 1000,
      };
      return mockToken;
    }

    // Try RSA S2S OAuth flow if secret looks like a PEM key
    if (clientSecret.includes('BEGIN') || clientSecret.length > 100) {
      try {
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

        if (response.ok) {
          const data = await response.json();
          const token = data?.result?.access_token || data?.data?.access_token || data?.access_token;
          if (token) {
            const expiresInMs = (data?.result?.expires_in || 7200) * 1000;
            tokenCache = {
              accessToken: token,
              expiresAt: now + expiresInMs,
            };
            return token;
          }
        }
      } catch (e) {
        console.warn('S2S RSA auth failed, falling back to direct API key token:', e);
      }
    }

    // Fallback: Use clientId directly as the Bearer token (YouCam v2.0 standard)
    tokenCache = {
      accessToken: clientId,
      expiresAt: now + 24 * 60 * 60 * 1000,
    };
    return clientId;
  })().finally(() => {
    inflightAuthPromise = null;
  });

  return inflightAuthPromise;
}

/**
 * Resets the in-memory token cache (useful for tests).
 */
export function resetTokenCache(): void {
  tokenCache = null;
  inflightAuthPromise = null;
}
