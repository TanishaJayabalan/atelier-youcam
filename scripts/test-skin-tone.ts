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
  console.log('\n[Test 2] Testing response normalization with mock raw output...');
  const mockRaw = {
    skin_tone: '#E8C5A0',
    undertone: 'warm',
    confidence: 0.92,
  };

  const normalized = normalizeSkinToneResponse(mockRaw);
  console.log('- Normalized Tone Hex:', normalized.hexCode);
  console.log('- Undertone:', normalized.undertone);
  console.log('- Season:', normalized.season);

  if (normalized.undertone !== 'warm') {
    throw new Error('Test 2 Failed: undertone mismatch');
  }
  console.log('✓ Test 2 Passed: Normalization outputs complete color profile.');

  // Test 3: End-to-End analyzeSkinTone
  console.log('\n[Test 3] Testing full analyzeSkinTone service...');
  const dummyBuffer = Buffer.from('mock-selfie-buffer');
  const result = await analyzeSkinTone(dummyBuffer);

  console.log('analyzeSkinTone result summary:');
  console.log('- Skin Tone Hex:', result.hexCode);
  console.log('- Undertone:', result.undertone);
  console.log('- Season Palette:', result.season);
  console.log('- Flattering colors:', result.flatteringColors.slice(0, 3).join(', '));

  if (!result.hexCode || !result.undertone) {
    throw new Error('Test 3 Failed: analyzeSkinTone result invalid');
  }
  console.log('✓ Test 3 Passed: analyzeSkinTone service runs end-to-end.');

  console.log('\n=========================================');
  console.log('All Component 4 (Skin Tone Analysis) tests PASSED successfully!');
  console.log('=========================================\n');
}

runSkinToneTests().catch((err) => {
  console.error('Skin Tone Tests failed:', err);
  process.exit(1);
});
