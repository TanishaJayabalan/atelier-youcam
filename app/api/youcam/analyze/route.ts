import { NextRequest, NextResponse } from 'next/server';
import { base64ToBuffer } from '@/lib/image-utils';
import { analyzeParallelBeautyProfile } from '@/lib/youcam/parallel-analyzer';
import { analyzeSkinTone } from '@/lib/youcam/skin-tone';
import { fetchWeather, WeatherResult } from '@/lib/weather';
import { getClosetItems, saveLookSession } from '@/lib/supabase';
import { generateRecommendation } from '@/lib/recommendation-engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      selfieBase64,
      vibe = 'classy',
      weather: clientWeather,
      lat,
      lon,
      city,
    } = body;

    if (!selfieBase64) {
      return NextResponse.json(
        { error: 'A selfie image (base64) is required for analysis.' },
        { status: 400 }
      );
    }

    const { buffer: selfieBuffer, contentType } = base64ToBuffer(selfieBase64);

    // 1. Resolve Weather from real Open-Meteo API
    let weather: WeatherResult;
    if (clientWeather && typeof clientWeather.tempC === 'number') {
      weather = clientWeather;
    } else if (typeof lat === 'number' && typeof lon === 'number') {
      try {
        weather = await fetchWeather(lat, lon, city);
      } catch (weatherErr: any) {
        return NextResponse.json(
          { error: `Weather service error: ${weatherErr.message}` },
          { status: 502 }
        );
      }
    } else {
      // Default to standard atmospheric baseline if coordinates were denied
      try {
        weather = await fetchWeather(37.7749, -122.4194, 'San Francisco');
      } catch (err: any) {
        return NextResponse.json(
          { error: `Could not retrieve weather data. Please provide location coordinates.` },
          { status: 400 }
        );
      }
    }

    // 2. Run Parallel Multi-AI Analyzer Pipeline (Skin + Fitzpatrick + Color Tones + Face Attributes) + Skin Tone + Closet
    const [beautyProfile, skinTone, closetItems] = await Promise.all([
      analyzeParallelBeautyProfile(selfieBuffer),
      analyzeSkinTone(selfieBuffer, contentType),
      getClosetItems(),
    ]);

    const skinAnalysis = beautyProfile.skin;

    // 3. Generate Unified Recommendations
    const recommendation = generateRecommendation({
      skin: skinAnalysis,
      skinTone,
      weather,
      vibe: (vibe as any) || 'classy',
      closet: closetItems,
    });

    // 4. Save intermediate look session
    const session = await saveLookSession({
      vibe,
      skin_analysis: skinAnalysis,
      skin_tone: skinTone,
      weather,
      recommendation,
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      skinAnalysis,
      skinTone,
      beautyProfile,
      weather,
      recommendation,
    });
  } catch (err: any) {
    console.error('Analyze route error:', err);
    return NextResponse.json(
      {
        error: err.message || 'An error occurred while analyzing your selfie.',
      },
      { status: 500 }
    );
  }
}
