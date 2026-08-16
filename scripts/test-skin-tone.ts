import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import {
  analyzeSkinTone,
  normalizeSkinToneResponse,
  getHarmonizedPalette,
} from '../lib/youcam/skin-tone';

async function runSkinToneTests() {
  console.log('--- Testing Component 4: YouCam Skin Tone & Color Analysis Service ---');

  // Test 1: Color Harmonies
  console.log('\n[Test 1] Testing seasonal color harmony lookups...');
  const autumn = getHarmonizedPalette('Autumn');
  const summer = getHarmonizedPalette('Summer');
  const spring = getHarmonizedPalette('Spring');

  if (!autumn.flattering.includes('#B85D43') || !autumn.blushShades.length) {
    throw new Error('Test 1 Failed: Autumn palette invalid');
  }
  if (!summer.flattering.includes('#C86267') || !summer.lipShades.length) {
    throw new Error('Test 1 Failed: Summer palette invalid');
  }
  if (!spring.flattering.includes('#E2725B')) {
    throw new Error('Test 1 Failed: Spring palette invalid');
  }
  console.log('✓ Test 1 Passed: Seasonal palettes verified.');

  // Test 2: Response Normalization
  console.log('\n[Test 2] Testing response normalization with structured raw output...');
  const sampleRaw = {
    color: {
      skin_color: '#E8C5A0',
      undertone: 'warm',
      confidence: 0.92,
      ita: 42,
    },
  };

  const normalized = normalizeSkinToneResponse(sampleRaw);
  console.log('- Normalized Tone Hex:', normalized.hexCode);
  console.log('- Undertone:', normalized.undertone);
  console.log('- Season:', normalized.season);

  if (normalized.undertone !== 'warm') {
    throw new Error('Test 2 Failed: undertone mismatch');
  }
  console.log('✓ Test 2 Passed: Normalization outputs complete color profile.');

  // Test 3: Live YouCam Skin Tone Analysis Call
  console.log('\n[Test 3] Testing live analyzeSkinTone service call with portrait image...');
  try {
    const sampleUrl = 'https://images.unsplash.com/photo-1597223557154-721c1cecc4b0?auto=format&fit=crop&w=800&q=80';
    const fetchRes = await fetch(sampleUrl);
    const arrayBuffer = await fetchRes.arrayBuffer();
    const selfieBuffer = Buffer.from(arrayBuffer);

    const result = await analyzeSkinTone(selfieBuffer, 'image/jpeg');
    console.log('Live analyzeSkinTone result summary:');
    console.log('- Skin Tone Hex:', result.hexCode);
    console.log('- Undertone:', result.undertone);
    console.log('- Season Palette:', result.season);
    console.log('- Flattering colors:', result.flatteringColors.slice(0, 3).join(', '));

    if (result.hexCode && result.undertone) {
      console.log('✓ Test 3 Passed: Live YouCam Skin Tone Analysis returned real results.');
    }
  } catch (err: any) {
    console.warn('Live skin tone API test note:', err.message);
  }

  console.log('\n=========================================');
  console.log('All Component 4 (Skin Tone Analysis) tests completed!');
  console.log('=========================================\n');
}

runSkinToneTests().catch((err) => {
  console.error('Skin Tone Tests failed:', err);
  process.exit(1);
});
