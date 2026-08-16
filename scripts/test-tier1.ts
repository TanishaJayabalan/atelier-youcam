import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { findFoundationMatch } from '../lib/foundation-matcher';
import { generateMakeupAdvice } from '../lib/makeup-advisor';
import { matchCelebrityLooks } from '../lib/celebrity-matcher';
import { computeSimulationIntensities } from '../lib/youcam/skin-simulation';
import { generateHairCareRoutine } from '../lib/hair-recommendation-engine';
import { generateLookFromOwnedProducts } from '../lib/owned-look-generator';
import { UserBeautyProfile } from '../types/beauty-profile';
import { WeatherResult } from '../lib/weather';
import closetData from '../data/demo-closet.json';

async function runTier1Verification() {
  console.log('========================================================');
  console.log('🧪 Starting Verification of Tier 1 AI Features');
  console.log('========================================================\n');

  const profile: UserBeautyProfile = {
    skin: {
      skinType: 'combination',
      overallScore: 82,
      concerns: {
        redness: { key: 'redness', displayName: 'Erythema', score: 65, severity: 'moderate' },
        acne: { key: 'acne', displayName: 'Active Acne', score: 60, severity: 'moderate' },
        pores: { key: 'pores', displayName: 'Pore Enlargement', score: 55, severity: 'moderate' },
        texture: { key: 'texture', displayName: 'Texture', score: 50, severity: 'moderate' },
      },
      topConcerns: [
        { key: 'redness', displayName: 'Erythema', score: 65, severity: 'moderate' },
        { key: 'acne', displayName: 'Active Acne', score: 60, severity: 'moderate' },
      ],
    },
    fitzpatrick: {
      type: 'III',
      label: 'Type III: Medium Golden / Light Olive',
      sunReaction: 'Sometimes mild burn, gradually tans to golden honey',
      melaninIndex: 50,
      description: 'Balanced melanin baseline with moderate UV resilience.',
    },
    colorTones: {
      skinColor: '#DFAC82',
      eyeColor: '#3A2E2B',
      eyeColorName: 'Brown',
      lipColor: '#C86267',
      eyebrowColor: '#4A3B32',
      hairColor: '#2B211D',
      hairColorName: 'Brown',
      undertone: 'warm',
    },
    faceAttributes: {
      faceShape: 'Oval',
      age: 26,
      gender: 'female',
      eyeShape: 'Almond',
      eyeSize: 'Average',
      eyeAngle: 'Upturned',
      eyeDistance: 'Average',
      eyelidType: 'Double-lid',
      eyebrowShape: 'Soft Angled',
      eyebrowThickness: 'Dense',
      eyebrowDistance: 'Average',
      lipShape: 'Full',
      noseWidth: 'Average',
      noseLength: 'Average',
      cheekbones: 'High Cheekbone',
      ratios: {
        faceAspectRatio: 1.44,
        horizontalThird: '33% : 34% : 33% (Balanced)',
        verticalFifth: '20% : 20% : 20% : 20% : 20% (Balanced)',
        eyeAspectRatio: 3.0,
        noseToLipToChin: 'Balanced lower-third ratio (1:1.618)',
        upperLipToLowerLip: 'Balanced (1:1.618 golden proportion)',
      },
    },
  };

  const weather: WeatherResult = {
    city: 'San Francisco',
    latitude: 37.7749,
    longitude: -122.4194,
    tempC: 24.5,
    tempF: 76.1,
    apparentTempC: 24.0,
    humidity: 42,
    uvIndex: 7.2,
    precipitationMm: 0,
    isDay: true,
    weatherCode: 1,
    condition: 'Mainly Clear',
    conditionCategory: 'warm',
    skinAdvisory: ['High UV Index (7.2)'],
  };

  // Test 1: Foundation Shade Finder
  console.log('[Test 1.2] Testing Foundation Shade Finder (Color Tones + Fitzpatrick)...');
  const foundationMatch = findFoundationMatch(profile.colorTones, profile.fitzpatrick.type);
  console.log(`✓ Foundation Matched: ${foundationMatch.shadeName} (${foundationMatch.shadeCode})`);
  console.log(`✓ Undertone Formulation: ${foundationMatch.undertone}, Finish: ${foundationMatch.recommendedFinish}`);
  console.log(`✓ YouCam Foundation Hex: ${foundationMatch.youcamEffect.color}`);
  if (!foundationMatch.shadeName || !foundationMatch.youcamEffect.color) throw new Error('Foundation match failed');
  console.log('✓ Test 1.2 Passed!\n');

  // Test 2: Face-Shape-Aware Makeup Placement
  console.log('[Test 1.3] Testing Face-Shape-Aware Placement Advisor...');
  const makeupAdvice = generateMakeupAdvice(profile.faceAttributes, profile.colorTones);
  console.log(`✓ Blush Technique: ${makeupAdvice.blushTechnique.techniqueName} (${makeupAdvice.blushTechnique.placementArea})`);
  console.log(`✓ Contour Sculpting: ${makeupAdvice.contourTechnique.patternName} (${makeupAdvice.contourTechnique.sculptAreas.join(', ')})`);
  console.log(`✓ Eye Architecture: ${makeupAdvice.eyeTechnique.eyelinerStyle}`);
  console.log(`✓ Key Tips: ${makeupAdvice.keyStylingTips[0]}`);
  if (!makeupAdvice.blushTechnique.techniqueName) throw new Error('Makeup advisor failed');
  console.log('✓ Test 1.3 Passed!\n');

  // Test 3: Celebrity Matching
  console.log('[Test 1.4] Testing Celebrity Look Archetype Matcher...');
  const celebMatches = matchCelebrityLooks(profile, 'Bold');
  console.log(`✓ Top Celebrity Match: ${celebMatches[0].profile.name} (${celebMatches[0].matchScore}% Match)`);
  console.log(`✓ Match Reasons: ${celebMatches[0].matchReasons.join(', ')}`);
  if (!celebMatches.length) throw new Error('Celebrity match failed');
  console.log('✓ Test 1.4 Passed!\n');

  // Test 4: Skin Simulation Intensities
  console.log('[Test 1.5] Testing AI Skin Simulation Intensities...');
  const simulationIntensities = computeSimulationIntensities(profile.skin);
  console.log(`✓ Simulation Intensities Derived:`, simulationIntensities.params);
  console.log(`✓ Projected Outcomes Count: ${simulationIntensities.projected.length}`);
  if (!simulationIntensities.projected.length) throw new Error('Simulation projection failed');
  console.log('✓ Test 1.5 Passed!\n');

  // Test 5: Hair Diagnostics & Haircare Routine
  console.log('[Test 1.6] Testing Hair Analysis & Trichology Care Engine...');
  const hairProfile = {
    curlType: '2b to 2c',
    curlTerm: 'Medium to Defined Wavy',
    curlCategory: 'wavy' as const,
    length: 'above chest' as const,
    lengthTerm: 'Medium Shoulder / Collarbone Length',
    frizziness: 2 as const,
    frizzTerm: 'Frizzy' as const,
    naturalColorHex: '#2B211D',
    naturalColorName: 'Espresso Brunette',
  };
  const hairRoutine = generateHairCareRoutine(hairProfile, profile, weather);
  console.log(`✓ Hair Frizz Strategy: ${hairRoutine.frizzDefenseStrategy}`);
  console.log(`✓ Prescribed Products Count: ${hairRoutine.recommendedProducts.length} (First: ${hairRoutine.recommendedProducts[0].name})`);
  console.log('✓ Test 1.6 Passed!\n');

  // Test 6: "Use What You Have" Complete Look Synthesizer
  console.log('[Test 1.7] Testing "Use What You Have" Closet Look Synthesizer...');
  const ownedLook = generateLookFromOwnedProducts(closetData as any, profile, makeupAdvice);
  console.log(`✓ Synthesized Look Name: ${ownedLook.lookName}`);
  console.log(`✓ Closet Completeness Score: ${ownedLook.completenessScore}% (${ownedLook.coveredCount}/${ownedLook.totalCategoriesCount} categories ready)`);
  console.log(`✓ VTO Payload Effects Count: ${ownedLook.vtoPayloadEffects.length}`);
  if (ownedLook.completenessScore === 0) throw new Error('Owned look generator failed');
  console.log('✓ Test 1.7 Passed!\n');

  console.log('========================================================');
  console.log('🎉 ALL TIER 1 FEATURES VERIFIED & PASSED SUCCESSFULLY!');
  console.log('========================================================');
}

runTier1Verification().catch((err) => {
  console.error('❌ Tier 1 Verification Failed:', err);
  process.exit(1);
});
