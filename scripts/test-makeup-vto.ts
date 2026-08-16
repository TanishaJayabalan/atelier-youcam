import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { applyMakeup, buildMakeupActions, MakeupStep } from '../lib/youcam/makeup-vto';

async function runMakeupVTOTests() {
  console.log('--- Testing Component 5: YouCam Makeup Virtual Try-On Service ---');

  // Test 1: Action builder
  console.log('\n[Test 1] Testing Makeup Action Builder...');
  const sampleSteps: MakeupStep[] = [
    { category: 'foundation', colorHex: '#DFAC82', intensity: 80, finish: 'matte' },
    { category: 'blush', colorHex: '#E89078', intensity: 65, pattern: 'natural' },
    { category: 'lip', colorHex: '#B85D43', intensity: 85, finish: 'matte', productName: 'Terracotta Matte' },
    { category: 'eyeshadow', colorHex: '#C19A6B', intensity: 70 },
    { category: 'eyebrow', colorHex: '#422B1E', intensity: 75 },
  ];

  const actions = buildMakeupActions(sampleSteps);
  console.log('Built Actions count:', actions.length);
  console.log('Lip action:', JSON.stringify(actions.find((a) => a.id === 'lipstick')));

  if (actions.length !== 5) {
    throw new Error('Test 1 Failed: Expected 5 actions');
  }
  const lipAction = actions.find((a) => a.id === 'lipstick');
  if (!lipAction || lipAction.params.color !== '#B85D43' || lipAction.params.intensity !== 85) {
    throw new Error('Test 1 Failed: Lip action format mismatch');
  }
  console.log('✓ Test 1 Passed: Action payload properly constructed.');

  // Test 2: Validation check
  console.log('\n[Test 2] Testing empty steps validation...');
  try {
    await applyMakeup(Buffer.from('test'), []);
    throw new Error('Test 2 Failed: Empty steps should throw error');
  } catch (err: any) {
    if (err.message.includes('At least one makeup step is required')) {
      console.log('✓ Test 2 Passed: Empty step array correctly rejected.');
    } else {
      throw err;
    }
  }

  console.log('\n=========================================');
  console.log('All Component 5 (Makeup VTO) unit tests PASSED successfully!');
  console.log('=========================================\n');
}

runMakeupVTOTests().catch((err) => {
  console.error('Makeup VTO test failed:', err);
  process.exit(1);
});
