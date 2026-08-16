import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { fetchWeather } from '../lib/weather';
import { getClosetItems, saveLookSession, getLookSession } from '../lib/supabase';
import { generateRecommendation } from '../lib/recommendation-engine';
import { normalizeSkinAnalysisResponse } from '../lib/youcam/skin-analysis';
import { normalizeSkinToneResponse } from '../lib/youcam/skin-tone';

async function runOrchestrationTests() {
  console.log('--- Testing Component 11: End-to-End Orchestration Flow ---');

  // Step 1: Live Weather Fetch
  console.log('\n[Stage 1] Resolving Live Weather from Open-Meteo...');
  const weather = await fetchWeather(37.7749, -122.4194, 'San Francisco');
  console.log('Weather resolved:', weather.city, `${weather.tempC}°C, UV Index: ${weather.uvIndex}`);

  // Step 2: Query Live Supabase Closet Inventory
  console.log('\n[Stage 2] Fetching Live Closet Items from Supabase PostgreSQL...');
  const closetItems = await getClosetItems();
  console.log('Closet inventory count from Supabase:', closetItems.length);

  if (closetItems.length === 0) {
    throw new Error('No closet items found in Supabase database.');
  }

  // Step 3: Fast Multi-concern Analysis Normalization
  console.log('\n[Stage 3] Processing AI Analysis Results...');
  const skinAnalysis = normalizeSkinAnalysisResponse({
    overall_score: 85,
    skin_type: 'normal',
    concerns: {
      redness: { score: 25 },
      pores: { score: 35 },
      acne: { score: 10 },
      wrinkles: { score: 15 },
    },
  });

  const skinTone = normalizeSkinToneResponse({
    color: {
      skin_color: '#DFAC82',
      undertone: 'warm',
      ita: 42,
    },
  });

  // Step 4: Recommendation Engine
  console.log('\n[Stage 4] Generating Harmonized Look with Closet & Weather Rules...');
  const recommendation = generateRecommendation({
    skin: skinAnalysis,
    skinTone,
    weather,
    vibe: 'classy',
    closet: closetItems,
  });

  console.log('Recommendation summary:', recommendation.outfit.stylingRationale);

  // Step 5: Save Session to Supabase
  console.log('\n[Stage 5] Persisting Session to Live Supabase PostgreSQL...');
  const session = await saveLookSession({
    vibe: 'classy',
    skin_analysis: skinAnalysis,
    skin_tone: skinTone,
    weather,
    recommendation,
  });

  console.log('Session Created with ID:', session.id);

  // Step 6: Verify Session Persistence
  const finalSession = await getLookSession(session.id);
  console.log('\n[Stage 6] Fetched Final Session from PostgreSQL:');
  console.log('- Session ID:', finalSession?.id);
  console.log('- Vibe:', finalSession?.vibe);
  console.log('- Has Recommendation:', Boolean(finalSession?.recommendation));

  if (!finalSession || finalSession.id !== session.id || !finalSession.recommendation) {
    throw new Error('Orchestration test failed: session data incomplete in database');
  }

  console.log('\n=========================================');
  console.log('All Component 11 (End-to-End Orchestration) tests PASSED successfully!');
  console.log('=========================================\n');
}

runOrchestrationTests().catch((err) => {
  console.error('Orchestration test failed:', err);
  process.exit(1);
});
