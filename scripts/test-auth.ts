import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import crypto from 'crypto';
import { formatPublicKeyPem, generateIdToken, getAccessToken, resetTokenCache } from '../lib/youcam/auth';

async function runAuthTests() {
  console.log('--- Testing Component 1: YouCam Authentication Module ---');

  // Test 1: RSA Key Encryption & Decryption
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

  // Test 2: Live YouCam S2S OAuth Token Retrieval
  console.log('\n[Test 2] Testing real YouCam S2S Auth with credentials from .env.local...');
  resetTokenCache();

  const token1 = await getAccessToken();
  console.log('First token call (length ' + token1.length + '):', token1.substring(0, 20) + '...');

  if (!token1 || token1.includes('mock')) {
    throw new Error('Test 2 Failed: Did not receive a real YouCam token');
  }

  // Test 3: In-Memory Caching
  console.log('\n[Test 3] Testing token caching mechanism...');
  const token2 = await getAccessToken();
  console.log('Second token call (cached):', token2.substring(0, 20) + '...');

  if (token1 === token2) {
    console.log('✓ Test 3 Passed: In-memory cache returns identical token without re-fetching.');
  } else {
    throw new Error('Test 3 Failed: Token caching failed');
  }

  console.log('\n=========================================');
  console.log('All Component 1 (YouCam Auth) tests PASSED successfully!');
  console.log('=========================================\n');
}

runAuthTests().catch((err) => {
  console.error('Auth test failed:', err);
  process.exit(1);
});
