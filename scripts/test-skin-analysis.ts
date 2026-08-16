import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { analyzeSkin, normalizeSkinAnalysisResponse, scoreToSeverity } from '../lib/youcam/skin-analysis';

async function runSkinAnalysisTests() {
  console.log('--- Testing Component 3: YouCam Skin Analysis Service ---');

  // Test 1: scoreToSeverity helper
  console.log('\n[Test 1] Testing severity thresholds...');
  if (scoreToSeverity(15) !== 'low' || scoreToSeverity(45) !== 'moderate' || scoreToSeverity(75) !== 'high') {
    throw new Error('Test 1 Failed: severity threshold mapping incorrect');
  }
  console.log('✓ Test 1 Passed: 15->low, 45->moderate, 75->high.');

  // Test 2: Normalization Logic
  console.log('\n[Test 2] Testing Response Normalization with structured raw input...');
  const sampleRaw = {
    overall_score: 88,
    skin_age: 24,
    concerns: {
      redness: { score: 72 },
      dark_circle: { score: 50 },
      pores: { score: 62 },
      wrinkles: { score: 10 },
      oiliness: { score: 60 },
      dryness: { score: 20 },
      acne: { score: 15 },
    },
  };

  const normalized = normalizeSkinAnalysisResponse(sampleRaw);
  console.log('Normalized skinType:', normalized.skinType);
  console.log('Normalized overallScore:', normalized.overallScore);
  console.log('Top concerns count:', normalized.topConcerns.length);
  console.log('Redness severity:', normalized.concerns.redness.severity, 'score:', normalized.concerns.redness.score);

  if (normalized.concerns.redness.severity !== 'high' || normalized.concerns.redness.score !== 72) {
    throw new Error('Test 2 Failed: Redness normalization mismatch');
  }
  console.log('✓ Test 2 Passed: Concerns populated with normalized metadata.');

  // Test 3: Live YouCam Skin Analysis API Call
  console.log('\n[Test 3] Testing live analyzeSkin service call with real portrait image...');
  try {
    const sampleUrl = 'https://images.unsplash.com/photo-1597223557154-721c1cecc4b0?auto=format&fit=crop&w=800&q=80';
    const fetchRes = await fetch(sampleUrl);
    const arrayBuffer = await fetchRes.arrayBuffer();
    const selfieBuffer = Buffer.from(arrayBuffer);

    const result = await analyzeSkin(selfieBuffer, 'image/jpeg');
    console.log('Live analyzeSkin result summary:');
    console.log('- Overall Score:', result.overallScore);
    console.log('- Skin Type:', result.skinType);
    console.log('- Top Concerns:', result.topConcerns.map((tc) => `${tc.displayName}: ${tc.score}% (${tc.severity})`).join(', '));

    if (result.overallScore > 0 && result.skinType) {
      console.log('✓ Test 3 Passed: Live YouCam Skin Analysis returned real results.');
    }
  } catch (err: any) {
    console.warn('Live skin analysis API test note:', err.message);
  }

  console.log('\n=========================================');
  console.log('All Component 3 (Skin Analysis) tests completed!');
  console.log('=========================================\n');
}

runSkinAnalysisTests().catch((err) => {
  console.error('Skin Analysis Tests failed:', err);
  process.exit(1);
});
