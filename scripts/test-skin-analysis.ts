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
  console.log('\n[Test 2] Testing Response Normalization with mock raw input...');
  const mockRaw = {
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

  const normalized = normalizeSkinAnalysisResponse(mockRaw);
  console.log('Normalized skinType:', normalized.skinType);
  console.log('Normalized overallScore:', normalized.overallScore);
  console.log('Top concerns count:', normalized.topConcerns.length);
  console.log('Redness severity:', normalized.concerns.redness.severity, 'score:', normalized.concerns.redness.score);

  if (normalized.concerns.redness.severity !== 'high' || normalized.concerns.redness.score !== 72) {
    throw new Error('Test 2 Failed: Redness normalization mismatch');
  }
  console.log('✓ Test 2 Passed: Concerns populated with normalized metadata.');

  // Test 3: End-to-end analyzeSkin function
  console.log('\n[Test 3] Testing full analyzeSkin service call...');
  const dummyBuffer = Buffer.from('mock-selfie-buffer');
  const result = await analyzeSkin(dummyBuffer);
  console.log('analyzeSkin result summary:');
  console.log('- Overall Score:', result.overallScore);
  console.log('- Skin Type:', result.skinType);
  console.log('- Top Concerns:', result.topConcerns.map((tc) => `${tc.displayName} (${tc.severity})`).join(', '));

  if (!result.concerns.redness || !result.topConcerns.length) {
    throw new Error('Test 3 Failed: analyzeSkin output invalid');
  }
  console.log('✓ Test 3 Passed: analyzeSkin service runs end-to-end.');

  console.log('\n=========================================');
  console.log('All Component 3 (Skin Analysis) tests PASSED successfully!');
  console.log('=========================================\n');
}

runSkinAnalysisTests().catch((err) => {
  console.error('Skin Analysis Tests failed:', err);
  process.exit(1);
});
