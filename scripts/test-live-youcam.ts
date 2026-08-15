import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { getAccessToken, generateIdToken } from '../lib/youcam/auth';

async function testLive() {
  console.log('Testing live YouCam with user credentials...');
  console.log('CLIENT_ID:', process.env.YOUCAM_CLIENT_ID?.substring(0, 15) + '...');
  console.log('CLIENT_SECRET:', process.env.YOUCAM_CLIENT_SECRET?.substring(0, 20) + '...');
  console.log('API_BASE:', process.env.YOUCAM_API_BASE);

  const clientId = process.env.YOUCAM_CLIENT_ID!;
  const secret = process.env.YOUCAM_CLIENT_SECRET!;
  const apiBase = process.env.YOUCAM_API_BASE || 'https://yce-api-01.perfectcorp.com';

  // 1. Test S2S Auth endpoint
  console.log('\n--- 1. Testing S2S Auth Endpoint ---');
  try {
    const idToken = generateIdToken(clientId, secret);
    console.log('Generated idToken length:', idToken.length);

    const authRes = await fetch(`${apiBase}/s2s/v1.0/client/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        id_token: idToken,
      }),
    });

    console.log('Auth status:', authRes.status);
    const authData = await authRes.json();
    console.log('Auth response:', JSON.stringify(authData, null, 2));

    const token = authData?.result?.access_token || authData?.data?.access_token || authData?.access_token;

    // 2. Test File Upload endpoint
    if (token) {
      console.log('\n--- 2. Testing File Upload with Token ---');
      const fileRes = await fetch(`${apiBase}/s2s/v1.0/file/skin-analysis`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: [{ content_type: 'image/jpeg', file_name: 'test.jpg' }],
        }),
      });
      console.log('File upload status:', fileRes.status);
      console.log('File upload response:', await fileRes.text());
    }
  } catch (err: any) {
    console.error('Test error:', err);
  }

  // 3. Test direct API Key as Bearer token
  console.log('\n--- 3. Testing Direct Bearer API Key ---');
  try {
    const fileRes2 = await fetch(`https://yce-api-01.makeupar.com/s2s/v2.0/file`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${clientId}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: [{ content_type: 'image/jpeg', file_name: 'test.jpg', file_size: 1024 }],
      }),
    });
    console.log('Direct key v2.0 status:', fileRes2.status);
    console.log('Direct key v2.0 response:', await fileRes2.text());
  } catch (err: any) {
    console.error('Direct test error:', err);
  }
}

testLive();
