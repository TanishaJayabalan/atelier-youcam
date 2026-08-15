import { NextRequest, NextResponse } from 'next/server';
import { base64ToBuffer } from '@/lib/image-utils';
import { analyzeParallelBeautyProfile } from '@/lib/youcam/parallel-analyzer';
import { fetchWeather, generateMockWeather, WeatherResult } from '@/lib/weather';
import { getClosetItems, saveLookSession } from '@/lib/supabase';
import { generateRecommendation } from '@/lib/recommendation-engine';
import { extractBufferTelemetry } from '@/lib/image-analysis';

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
      telemetry: clientTelemetry,
    } = body;

    if (!selfieBase64) {
      return NextResponse.json(
        { error: 'A selfie image (base64) is required for analysis.' },
        { status: 400 }
      );
    }

    const { buffer: selfieBuffer, contentType } = base64ToBuffer(selfieBase64);

    // Derive telemetry if not supplied by client
    const telemetry = clientTelemetry || extractBufferTelemetry(selfieBuffer);

    // 1. Resolve Weather
    let weather: WeatherResult;
    if (clientWeather && clientWeather.tempC !== undefined) {
      weather = clientWeather;
    } else if (typeof lat === 'number' && typeof lon === 'number') {
      try {
        weather = await fetchWeather(lat, lon, city);
      } catch {
        weather = generateMockWeather();
      }
    } else {
      weather = generateMockWeather();
    }

    // 2. Run Parallel Multi-AI Analyzer Pipeline (Skin + Fitzpatrick + Color Tones + Face Attributes)
    const [beautyProfile, skinTone, closetItems] = await Promise.all([
      analyzeParallelBeautyProfile(selfieBuffer, telemetry).catch((err) => {
        console.warn('Parallel beauty analyzer warning:', err);
        return analyzeParallelBeautyProfile(selfieBuffer, telemetry);
      }),
      analyzeSkinTone(selfieBuffer, contentType, telemetry).catch((err) => {
        console.warn('Skin tone API error, using optical CV analysis:', err.message);
        return generateMockSkinTone(selfieBuffer, telemetry);
      }),
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
