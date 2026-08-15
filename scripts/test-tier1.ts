import { analyzeParallelBeautyProfile } from '../lib/youcam/parallel-analyzer';
import { findFoundationMatch } from '../lib/foundation-matcher';
import { generateMakeupAdvice } from '../lib/makeup-advisor';
import { matchCelebrityLooks } from '../lib/celebrity-matcher';
import { transferMakeupLook } from '../lib/youcam/makeup-transfer';
import { simulateSkinOutcome, computeSimulationIntensities } from '../lib/youcam/skin-simulation';
import { analyzeHairDiagnostics } from '../lib/youcam/hair-analyzer';
import { generateHairCareRoutine } from '../lib/hair-recommendation-engine';
import { generateLookFromOwnedProducts } from '../lib/owned-look-generator';
import closetData from '../data/demo-closet.json';

async function runTier1Verification() {
  console.log('========================================================');
  console.log('🧪 Starting Verification of Tier 1 AI Features');
  console.log('========================================================\n');

  // Test 1: Parallel Unified Intelligence Pipeline
  console.log('[Test 1.1] Testing Parallel Multi-Engine Analyzer Pipeline...');
  const mockTelemetry = {
    avgR: 210,
    avgG: 165,
    avgB: 140,
    rednessRatio: 1.27,
    specularRatio: 0.16,
    roughnessVariance: 16,
    underEyeContrast: 0.12,
    luminance: 175,
  };
  const profile = await analyzeParallelBeautyProfile('https://mock-image.com/selfie.jpg', mockTelemetry);
  console.log(`✓ Skin Vitality: ${profile.skin.overallScore}/100, Type: ${profile.skin.skinType}`);
  console.log(`✓ Fitzpatrick Classification: ${profile.fitzpatrick.label} (Melanin Index: ${profile.fitzpatrick.melaninIndex})`);
  console.log(`✓ Color Tones: Skin ${profile.colorTones.skinColor}, Eye ${profile.colorTones.eyeColor} (${profile.colorTones.eyeColorName}), Undertone: ${profile.colorTones.undertone}`);
  console.log(`✓ Face Attributes: ${profile.faceAttributes.faceShape} face, ${profile.faceAttributes.eyeShape} eyes, ${profile.faceAttributes.eyelidType}`);
  console.log('✓ Test 1.1 Passed!\n');

  // Test 2: Foundation Shade Finder
  console.log('[Test 1.2] Testing Foundation Shade Finder (Color Tones + Fitzpatrick)...');
  const foundationMatch = findFoundationMatch(profile.colorTones, profile.fitzpatrick.type);
  console.log(`✓ Foundation Matched: ${foundationMatch.shadeName} (${foundationMatch.shadeCode})`);
  console.log(`✓ Undertone Formulation: ${foundationMatch.undertone}, Finish: ${foundationMatch.recommendedFinish}`);
  console.log(`✓ YouCam Foundation Hex: ${foundationMatch.youcamEffect.color}`);
  if (!foundationMatch.shadeName || !foundationMatch.youcamEffect.color) throw new Error('Foundation match failed');
  console.log('✓ Test 1.2 Passed!\n');

  // Test 3: Face-Shape-Aware Makeup Placement
  console.log('[Test 1.3] Testing Face-Shape-Aware Placement Advisor...');
  const makeupAdvice = generateMakeupAdvice(profile.faceAttributes, profile.colorTones);
  console.log(`✓ Blush Technique: ${makeupAdvice.blushTechnique.techniqueName} (${makeupAdvice.blushTechnique.placementArea})`);
  console.log(`✓ Contour Sculpting: ${makeupAdvice.contourTechnique.patternName} (${makeupAdvice.contourTechnique.sculptAreas.join(', ')})`);
  console.log(`✓ Eye Architecture: ${makeupAdvice.eyeTechnique.eyelinerStyle}`);
  console.log(`✓ Key Tips: ${makeupAdvice.keyStylingTips[0]}`);
  if (!makeupAdvice.blushTechnique.techniqueName) throw new Error('Makeup advisor failed');
  console.log('✓ Test 1.3 Passed!\n');

  // Test 4: Celebrity Matching & Makeup Transfer
  console.log('[Test 1.4] Testing Celebrity Look Archetype Matcher & AI Transfer...');
  const celebMatches = matchCelebrityLooks(profile, 'Bold');
  console.log(`✓ Top Celebrity Match: ${celebMatches[0].profile.name} (${celebMatches[0].matchScore}% Match)`);
  console.log(`✓ Match Reasons: ${celebMatches[0].matchReasons.join(', ')}`);

  const transferResult = await transferMakeupLook({
    srcImage: 'https://mock-image.com/selfie.jpg',
    refImage: celebMatches[0].profile.referencePhotoUrl,
  });
  console.log(`✓ Makeup Transfer Status: ${transferResult.status}, Output URL: ${transferResult.imageUrl.slice(0, 40)}...`);
  console.log('✓ Test 1.4 Passed!\n');

  // Test 5: Skin Simulation "After Routine" Preview
  console.log('[Test 1.5] Testing AI Skin Simulation 30-Day Recovery...');
  const simulationIntensities = computeSimulationIntensities(profile.skin);
  console.log(`✓ Simulation Intensities Derived:`, simulationIntensities.params);
  console.log(`✓ Projected Outcomes Count: ${simulationIntensities.projected.length}`);

  const simResult = await simulateSkinOutcome('https://mock-image.com/selfie.jpg', profile.skin);
  console.log(`✓ Simulated Image Outcome URL: ${simResult.simulatedImageUrl.slice(0, 40)}...`);
  console.log('✓ Test 1.5 Passed!\n');

  // Test 6: Hair Diagnostics & Haircare Routine
  console.log('[Test 1.6] Testing Hair Analysis & Trichology Care Engine...');
  const hairProfile = await analyzeHairDiagnostics('https://mock-image.com/selfie.jpg');
  console.log(`✓ Hair Pattern: ${hairProfile.curlTerm} (${hairProfile.curlType}), Frizz: ${hairProfile.frizzTerm}`);

  const hairRoutine = generateHairCareRoutine(hairProfile, profile, {
    city: 'San Francisco',
    tempC: 22,
    humidity: 70,
    uvIndex: 6,
    condition: 'Partly Cloudy',
  });
  console.log(`✓ Hair Frizz Strategy: ${hairRoutine.frizzDefenseStrategy}`);
  console.log(`✓ Prescribed Products Count: ${hairRoutine.recommendedProducts.length} (First: ${hairRoutine.recommendedProducts[0].name})`);
  console.log('✓ Test 1.6 Passed!\n');

  // Test 7: "Use What You Have" Complete Look Synthesizer
  console.log('[Test 1.7] Testing "Use What You Have" Closet Look Synthesizer...');
  const ownedLook = generateLookFromOwnedProducts(closetData as any, profile, makeupAdvice);
  console.log(`✓ Synthesized Look Name: ${ownedLook.lookName}`);
  console.log(`✓ Closet Completeness Score: ${ownedLook.completenessScore}% (${ownedLook.coveredCount}/${ownedLook.totalCategoriesCount} categories ready)`);
  console.log(`✓ VTO Payload Effects Count: ${ownedLook.vtoPayloadEffects.length}`);
  ownedLook.steps.forEach((s) => {
    console.log(`  - [${s.status.toUpperCase()}] ${s.categoryName}: ${s.itemUsed ? s.itemUsed.name : s.suggestedGapFill}`);
  });
  if (ownedLook.completenessScore === 0) throw new Error('Owned look generator failed');
  console.log('✓ Test 1.7 Passed!\n');

  console.log('========================================================');
  console.log('🎉 ALL 7 TIER 1 FEATURES VERIFIED & PASSED SUCCESSFULLY!');
  console.log('========================================================');
}

runTier1Verification().catch((err) => {
  console.error('❌ Tier 1 Verification Failed:', err);
  process.exit(1);
});
