import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { analyzeImageOptically } from '../lib/optical-analyzer';
import { generateRecommendation } from '../lib/recommendation-engine';
import { getClosetItems } from '../lib/supabase';
import { fetchWeather } from '../lib/weather';

async function testRoute() {
  console.log('--- Testing Dynamic Analysis Pipeline ---');

  const selfieRes = await fetch('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&h=600&q=80');
  const selfieBuf = Buffer.from(await selfieRes.arrayBuffer());

  const weather = await fetchWeather(37.7749, -122.4194, 'San Francisco');
  const closetItems = await getClosetItems();

  const opticalRes = await analyzeImageOptically(selfieBuf);

  const recommendation = generateRecommendation({
    skin: opticalRes.skinAnalysis,
    skinTone: opticalRes.skinTone,
    weather,
    vibe: 'classy',
    closet: closetItems,
  });

  console.log('\n✓ Results:');
  console.log('Hex:', opticalRes.skinTone.hexCode);
  console.log('Undertone:', opticalRes.skinTone.undertone);
  console.log('Season Palette:', opticalRes.skinTone.season);
  console.log('Fitzpatrick:', opticalRes.beautyProfile.fitzpatrick.label);
  console.log('Overall Vitality:', opticalRes.skinAnalysis.overallScore);
  console.log('Skin Concerns Count:', Object.keys(opticalRes.skinAnalysis.concerns).length);
  console.log('Makeup Steps Formulated:', recommendation.makeupSteps.length);
  console.log('Outfit Selected:', recommendation.outfit.topOrDress?.name, '+', recommendation.outfit.bottom?.name);
}

testRoute();
