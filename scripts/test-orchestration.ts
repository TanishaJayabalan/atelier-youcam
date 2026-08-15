import { base64ToBuffer } from '../lib/image-utils';
import { analyzeSkin } from '../lib/youcam/skin-analysis';
import { analyzeSkinTone } from '../lib/youcam/skin-tone';
import { applyMakeup } from '../lib/youcam/makeup-vto';
import { applyOutfit } from '../lib/youcam/clothes-vto';
import { fetchWeather } from '../lib/weather';
import { getClosetItems, saveLookSession, getLookSession } from '../lib/supabase';
import { generateRecommendation } from '../lib/recommendation-engine';

async function runOrchestrationTests() {
  console.log('--- Testing Component 11: API Orchestration Flow ---');

  const mockBase64 = 'data:image/jpeg;base64,' + Buffer.from('mock-camera-selfie-stream').toString('base64');
  const { buffer: selfieBuf, contentType } = base64ToBuffer(mockBase64);

  // Step 1: Weather
  console.log('\n[Stage 1] Resolving Weather...');
  const weather = await fetchWeather(37.7749, -122.4194, 'San Francisco');
  console.log('Weather resolved:', weather.city, weather.tempC, 'C, UV:', weather.uvIndex);

  // Step 2: Parallel Analysis (Skin + Skin Tone + Closet)
  console.log('\n[Stage 2] Running Fast Analysis Stage...');
  const [skinAnalysis, skinTone, closetItems] = await Promise.all([
    analyzeSkin(selfieBuf, contentType),
    analyzeSkinTone(selfieBuf, contentType),
    getClosetItems(),
  ]);

  console.log('Skin score:', skinAnalysis.overallScore, 'Top concern:', skinAnalysis.topConcerns[0]?.displayName);
  console.log('Skin undertone:', skinTone.undertone, 'Season:', skinTone.season);
  console.log('Closet inventory count:', closetItems.length);

  // Step 3: Recommendation Engine
  console.log('\n[Stage 3] Generating Personalized Look...');
  const recommendation = generateRecommendation({
    skin: skinAnalysis,
    skinTone,
    weather,
    vibe: 'classy',
    closet: closetItems,
  });

  const session = await saveLookSession({
    vibe: 'classy',
    skin_analysis: skinAnalysis,
    skin_tone: skinTone,
    weather,
    recommendation,
  });

  console.log('Session Created with ID:', session.id);
  console.log('Recommendation summary:', recommendation.outfit.stylingRationale);

  // Step 4: Parallel Rendering (Makeup VTO + Clothes VTO)
  console.log('\n[Stage 4] Running Parallel VTO Rendering Stage...');
  const [makeupRes, clothesRes] = await Promise.all([
    applyMakeup(selfieBuf, recommendation.makeupSteps, contentType),
    recommendation.outfit.topOrDress
      ? applyOutfit(selfieBuf, recommendation.outfit.topOrDress.image_url, {
          garmentName: recommendation.outfit.topOrDress.name,
          category: recommendation.outfit.topOrDress.category,
        })
      : Promise.resolve({ resultImageUrl: null }),
  ]);

  console.log('Rendered Makeup URL:', makeupRes.resultImageUrl);
  console.log('Rendered Outfit URL:', clothesRes.resultImageUrl);

  // Update session with rendered assets
  await saveLookSession({
    ...session,
    makeup_result_url: makeupRes.resultImageUrl,
    outfit_result_url: clothesRes.resultImageUrl || undefined,
  });

  // Step 5: Verify Session Persistence
  const finalSession = await getLookSession(session.id);
  console.log('\n[Stage 5] Final Session in DB:');
  console.log('- Session ID:', finalSession?.id);
  console.log('- Vibe:', finalSession?.vibe);
  console.log('- Has Makeup URL:', Boolean(finalSession?.makeup_result_url));
  console.log('- Has Outfit URL:', Boolean(finalSession?.outfit_result_url));

  if (!finalSession?.makeup_result_url || !finalSession?.recommendation) {
    throw new Error('Orchestration test failed: session data incomplete');
  }

  console.log('\n=========================================');
  console.log('All Component 11 (API Orchestration) tests PASSED successfully!');
  console.log('=========================================\n');
}

runOrchestrationTests().catch((err) => {
  console.error('Orchestration test failed:', err);
  process.exit(1);
});
