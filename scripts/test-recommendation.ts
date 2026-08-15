import { generateRecommendation } from '../lib/recommendation-engine';
import { generateMockSkinAnalysis } from '../lib/youcam/skin-analysis';
import { generateMockSkinTone } from '../lib/youcam/skin-tone';
import { generateMockWeather } from '../lib/weather';
import demoCloset from '../data/demo-closet.json';
import { ClosetItem } from '../lib/supabase';

async function runRecommendationTests() {
  console.log('--- Testing Component 10: Recommendation Engine ---');

  const skin = generateMockSkinAnalysis(); // has redness: 68 (high)
  const skinTone = generateMockSkinTone(); // warm undertone
  const weather = generateMockWeather(); // tempC: 24.5, uvIndex: 7.2 (high)
  const closet = demoCloset as ClosetItem[];

  // Test 1: Redness & Retinol Conflict Detection
  console.log('\n[Test 1] Testing Redness + Retinol conflict rule...');
  const recClassy = generateRecommendation({
    skin,
    skinTone,
    weather,
    vibe: 'classy',
    closet,
  });

  const rednessWarning = recClassy.skincareNotes.warnings.find(w => w.includes('Redness Detected'));
  const pmRetinolStep = recClassy.skincareNotes.pmSteps.find(s => s.isModified);

  console.log('Redness Warning:', rednessWarning);
  console.log('Modified PM Step:', pmRetinolStep?.productName, '-> Note:', pmRetinolStep?.actionNote);

  if (!rednessWarning || !pmRetinolStep || !pmRetinolStep.actionNote.includes('Paused Retinol')) {
    throw new Error('Test 1 Failed: Redness conflict did not trigger routine modification');
  }
  console.log('✓ Test 1 Passed: Redness detection correctly paused Retinol and substituted soothing treatment.');

  // Test 2: High UV Index & SPF Rule
  console.log('\n[Test 2] Testing High UV Index (>= 6) Rule...');
  const uvWarning = recClassy.skincareNotes.warnings.find(w => w.includes('High UV Index'));
  const amSpfStep = recClassy.skincareNotes.amSteps.find(s => s.stepCategory.includes('SPF'));

  console.log('UV Warning:', uvWarning);
  console.log('AM SPF Step:', amSpfStep?.productName);

  if (!uvWarning || !amSpfStep) {
    throw new Error('Test 2 Failed: High UV did not produce SPF warning or step');
  }

  // Test 2b: Missing SPF triggers Gap-Fill
  const closetNoSpf = closet.filter(i => (i.metadata as any)?.step_category !== 'spf');
  const recNoSpf = generateRecommendation({
    skin,
    skinTone,
    weather,
    vibe: 'classy',
    closet: closetNoSpf,
  });
  const spfGap = recNoSpf.gapFillSuggestions.find(g => g.category.includes('SPF'));
  console.log('Missing SPF gap fill:', spfGap?.reason);
  if (!spfGap || !spfGap.reason.includes('UV Index')) {
    throw new Error('Test 2b Failed: Missing SPF did not trigger high-urgency gap fill');
  }
  console.log('✓ Test 2 Passed: High UV triggers SPF steps and gap-fills when missing.');

  // Test 3: Vibe Profile Variations
  console.log('\n[Test 3] Testing distinct Vibe Profiles (Bold vs Natural)...');
  const recBold = generateRecommendation({ skin, skinTone, weather, vibe: 'bold', closet });
  const recNatural = generateRecommendation({ skin, skinTone, weather, vibe: 'natural', closet });

  const boldLip = recBold.makeupSteps.find(s => s.category === 'lip');
  const naturalLip = recNatural.makeupSteps.find(s => s.category === 'lip');

  console.log('Bold Lip Intensity:', boldLip?.intensity, 'Finish:', boldLip?.finish);
  console.log('Natural Lip Intensity:', naturalLip?.intensity, 'Finish:', naturalLip?.finish);

  if ((boldLip?.intensity ?? 0) <= (naturalLip?.intensity ?? 0)) {
    throw new Error('Test 3 Failed: Bold lip intensity must be higher than Natural lip intensity');
  }
  console.log('✓ Test 3 Passed: Vibe profiles produce distinct intensities and finishes.');

  // Test 4: Gap-Fill Explanations
  console.log('\n[Test 4] Testing Gap Fill reason generation...');
  console.log('Gap fill suggestions for Bold look:', recBold.gapFillSuggestions);
  if (recBold.gapFillSuggestions.length > 0) {
    const gap = recBold.gapFillSuggestions[0];
    if (!gap.reason || gap.reason.length < 10) {
      throw new Error('Test 4 Failed: Gap fill missing descriptive reason');
    }
  }
  console.log('✓ Test 4 Passed: Gap-fill suggestions include reasoned rationale.');

  console.log('\n=========================================');
  console.log('All Component 10 (Recommendation Engine) tests PASSED successfully!');
  console.log('=========================================\n');
}

runRecommendationTests().catch((err) => {
  console.error('Recommendation Engine test failed:', err);
  process.exit(1);
});
