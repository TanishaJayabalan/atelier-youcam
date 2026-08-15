import { uploadFile, runTask, pollTask, formatYouCamError, generateRequestId } from '../lib/youcam/client';

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

  // Test 3: Generic Upload -> Run -> Poll pipeline
  console.log('\n[Test 3] Testing Generic Upload -> Run -> Poll Pipeline...');
  const dummyBuffer = Buffer.from('mock-image-bytes-123456');
  
  const fileId = await uploadFile('/s2s/v1.0/file/skin-analysis', dummyBuffer, 'image/jpeg', 'test.jpg');
  console.log('Upload returned fileId:', fileId);

  const taskId = await runTask('/s2s/v1.0/task/skin-analysis', {
    file_id: fileId,
    concerns: ['wrinkle', 'pore', 'dark_circle'],
  });
  console.log('Run task returned taskId:', taskId);

  const pollResult = await pollTask('/s2s/v1.0/task/skin-analysis', taskId, {
    mockResultGenerator: () => ({
      status: 'success',
      skin_type: 'combination',
      scores: { wrinkle: 85, pore: 70, dark_circle: 60 },
    }),
  });
  console.log('Poll returned result:', pollResult);

  if (pollResult.skin_type === 'combination' && pollResult.scores.wrinkle === 85) {
    console.log('✓ Test 3 Passed: Upload -> Run -> Poll pipeline functions correctly.');
  } else {
    throw new Error('Test 3 Failed: Poll result did not match expected structure');
  }

  console.log('\n=========================================');
  console.log('All Component 2 (YouCam Task Client) tests PASSED successfully!');
  console.log('=========================================\n');
}

runClientTests().catch((err) => {
  console.error('Client test failed:', err);
  process.exit(1);
});
