import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { getAccessToken } from '../lib/youcam/auth';

async function testFaceRatios() {
  const token = await getAccessToken(true);
  const apiBase = 'https://yce-api-01.perfectcorp.com';

  console.log('--- 1. Testing Live Auth & S3 Presigned Upload ---');
  console.log('Access token obtained:', token.substring(0, 25) + '...');

  // Square cropped front portrait
  const selfieRes = await fetch('https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&h=600&q=80');
  const selfieBytes = Buffer.from(await selfieRes.arrayBuffer());

  const fileRes = await fetch(`${apiBase}/s2s/v1.0/file/skin-analysis`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files: [{ content_type: 'image/jpeg', file_name: 'selfie.jpg' }],
    }),
  });
  const fileData = await fileRes.json();
  console.log('YouCam File Init Status:', fileRes.status, fileData);

  const uploadReq = fileData.result.files[0].requests[0];
  const fileId = fileData.result.files[0].file_id;

  const s3Res = await fetch(uploadReq.url, {
    method: 'PUT',
    headers: { 'Content-Type': 'image/jpeg' },
    body: selfieBytes,
  });
  console.log('S3 Image Upload Status:', s3Res.status);

  // Submit task with standard clinical concerns
  console.log('\n--- 2. Submitting Task to YouCam AI Engine ---');
  const skinRes = await fetch(`${apiBase}/s2s/v1.0/task/skin-analysis`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      request_id: 1001,
      payload: {
        file_sets: { src_ids: [fileId] },
        actions: [{ id: 0, dst_actions: ['pore', 'texture', 'redness', 'oiliness', 'moisture'] }],
      },
    }),
  });

  const skinData = await skinRes.json();
  console.log('Task Submission Status:', skinRes.status, skinData);

  if (skinData?.result?.task_id) {
    const taskId = skinData.result.task_id;
    console.log('Polling Live Task ID:', taskId);
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 1500));
      const pRes = await fetch(`${apiBase}/s2s/v1.0/task/skin-analysis?task_id=${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const pData = await pRes.json();
      console.log(`Poll [${i}]: Status =`, pData?.result?.status, pData?.result?.error || '');
      if (pData?.result?.status === 'success') {
        console.log('🎉 LIVE TASK SUCCESSFUL! YouCam returned:', JSON.stringify(pData.result, null, 2));
        break;
      }
    }
  }
}

testFaceRatios();
