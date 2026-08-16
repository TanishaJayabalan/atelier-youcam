import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { uploadFile, formatYouCamError, generateRequestId } from '../lib/youcam/client';

async function runClientTests() {
  console.log('--- Testing Component 2: Generic YouCam Task Client ---');

  // Test 1: Error Formatter
  console.log('\n[Test 1] Testing Error Code Formatting...');
  const noFaceErr = formatYouCamError('error_no_face', 'No face found in image');
  console.log('error_no_face ->', noFaceErr.userFriendlyMessage);
  if (!noFaceErr.userFriendlyMessage.includes('clear, front-facing selfie')) {
    throw new Error('Test 1 Failed: error_no_face mapping mismatch');
  }

  const nsfwErr = formatYouCamError('error_nsfw_content_detected');
  console.log('error_nsfw ->', nsfwErr.userFriendlyMessage);
  if (!nsfwErr.userFriendlyMessage.includes('content guidelines')) {
    throw new Error('Test 1 Failed: nsfw mapping mismatch');
  }
  console.log('✓ Test 1 Passed: Error code translation works.');

  // Test 2: Request ID Generator
  console.log('\n[Test 2] Testing Request ID Generation...');
  const req1 = generateRequestId('skin');
  const req2 = generateRequestId('skin');
  console.log('Generated IDs:', req1, req2);
  if (req1 === req2 || !req1.startsWith('skin_')) {
    throw new Error('Test 2 Failed: Request ID collision or bad format');
  }
  console.log('✓ Test 2 Passed: Request ID generation is unique.');

  // Test 3: Live File Upload via Presigned S3 URL
  console.log('\n[Test 3] Testing Live S2S File Upload...');
  const dummyBuffer = Buffer.from('test-image-payload-data');
  const fileId = await uploadFile('/s2s/v1.0/file/skin-analysis', dummyBuffer, 'image/jpeg', 'test.jpg');
  console.log('Live upload returned fileId (length ' + fileId.length + '):', fileId.substring(0, 20) + '...');

  if (fileId && !fileId.includes('mock')) {
    console.log('✓ Test 3 Passed: File upload and presigned PUT successfully executed against YouCam S3 storage.');
  } else {
    throw new Error('Test 3 Failed: Upload returned invalid file ID');
  }

  console.log('\n=========================================');
  console.log('All Component 2 (YouCam Task Client) tests PASSED successfully!');
  console.log('=========================================\n');
}

runClientTests().catch((err) => {
  console.error('Client test failed:', err);
  process.exit(1);
});
