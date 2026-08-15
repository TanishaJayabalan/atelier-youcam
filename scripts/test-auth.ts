import crypto from 'crypto';
import { formatPublicKeyPem, generateIdToken, getAccessToken, resetTokenCache } from '../lib/youcam/auth';

async function runAuthTests() {
  console.log('--- Testing Component 1: YouCam Authentication Module ---');

  // Test 1: RSA Key Generation & Encryption
  console.log('\n[Test 1] Generating RSA key pair and encrypting id_token...');
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  const clientId = 'test_client_123';
  const timestamp = 1700000000000;
  const idToken = generateIdToken(clientId, publicKey, timestamp);

  console.log('Generated idToken (base64, length:', idToken.length, '):', idToken.substring(0, 32) + '...');

  // Decrypt with private key to verify exact payload matches
  const decrypted = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    },
    Buffer.from(idToken, 'base64')
  ).toString('utf8');

  console.log('Decrypted payload:', decrypted);
  if (decrypted === `client_id=${clientId}&timestamp=${timestamp}`) {
    console.log('✓ Test 1 Passed: Encryption and payload format match specification.');
  } else {
    throw new Error('Test 1 Failed: Decrypted payload mismatch');
  }

  // Test 2: In-Memory Caching
  console.log('\n[Test 2] Testing token caching mechanism...');
  resetTokenCache();

  // Test mock mode auth call
  process.env.YOUCAM_CLIENT_ID = 'mock_client_id';
  process.env.YOUCAM_CLIENT_SECRET = publicKey;

  const token1 = await getAccessToken();
  console.log('First token call:', token1);

  const token2 = await getAccessToken();
  console.log('Second token call (should be cached):', token2);

  if (token1 === token2 && token1.startsWith('mock_youcam_token_')) {
    console.log('✓ Test 2 Passed: In-memory cache returns identical token without re-fetching.');
  } else {
    throw new Error('Test 2 Failed: Token caching failed');
  }

  console.log('\n=========================================');
  console.log('All Component 1 (YouCam Auth) tests PASSED successfully!');
  console.log('=========================================\n');
}

runAuthTests().catch((err) => {
  console.error('Auth test failed:', err);
  process.exit(1);
});
