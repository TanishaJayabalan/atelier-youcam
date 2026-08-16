import { NextRequest, NextResponse } from 'next/server';
import { base64ToBuffer } from '@/lib/image-utils';
import { analyzeParallelBeautyProfile } from '@/lib/youcam/parallel-analyzer';
import { analyzeSkinTone } from '@/lib/youcam/skin-tone';
import { analyzeImageOptically } from '@/lib/optical-analyzer';
import { fetchWeather, WeatherResult } from '@/lib/weather';
import { getClosetItems, saveLookSession } from '@/lib/supabase';
import { generateRecommendation } from '@/lib/recommendation-engine';
import { generateCustomBeautyLook, CustomBeautyLook } from '@/lib/gemini/beauty-stylist';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      selfieBase64,
      vibe = 'classy',
      customPrompt,
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
      try {
        weather = await fetchWeather(37.7749, -122.4194, 'San Francisco');
      } catch (err: any) {
        return NextResponse.json(
          { error: `Could not retrieve weather data. Please provide location coordinates.` },
          { status: 400 }
        );
      }
    }

    // 2. Fetch Closet Items
    const closetItems = await getClosetItems();

    // 3. Attempt Live YouCam AI Analysis -> Optical Pixel Analyzer Fallback
    let beautyProfile: any;
    let skinTone: any;
    let skinAnalysis: any;
    let engineSource = 'youcam_ai';
    let engineNotice: string | undefined;

    try {
      console.log('[Analyze Route]: Attempting live YouCam S2S AI analysis...');
      const [bpRes, stRes] = await Promise.all([
        analyzeParallelBeautyProfile(selfieBuffer),
        analyzeSkinTone(selfieBuffer, contentType),
      ]);
      beautyProfile = bpRes;
      skinTone = stRes;
      skinAnalysis = beautyProfile.skin;
      console.log('✓ Live YouCam AI Analysis succeeded');
    } catch (youcamErr: any) {
      console.warn('[Analyze Route]: Live YouCam AI returned:', youcamErr.message);
      console.log('[Analyze Route]: Running High-Precision Optical Pixel Analyzer fallback...');

      const opticalRes = await analyzeImageOptically(selfieBuffer);
      beautyProfile = opticalRes.beautyProfile;
      skinTone = opticalRes.skinTone;
      skinAnalysis = opticalRes.skinAnalysis;

      const isCreditLimit = youcamErr.message?.includes('CreditInsufficiency') || youcamErr.message?.includes('credits');
      engineSource = isCreditLimit ? 'optical_pixel_analyzer_credits_exhausted' : 'optical_pixel_analyzer';
      engineNotice = isCreditLimit
        ? "YouCam API credits are currently exhausted. Extracted 100% dynamic diagnostics via High-Precision Optical Pixel Analysis."
        : `Optical Pixel Diagnostics active (${youcamErr.message})`;
    }

    // 4. Generate Custom Look with Gemini if customPrompt is present
    let customLook: CustomBeautyLook | undefined;
    if (customPrompt && typeof customPrompt === 'string' && customPrompt.trim()) {
      try {
        customLook = await generateCustomBeautyLook({
          prompt: customPrompt.trim(),
          skinTone,
          weather,
          beautyProfile,
        });
      } catch (geminiErr: any) {
        console.warn('[Analyze Route Gemini Warning]:', geminiErr);
      }
    }

    // 5. Generate Unified Recommendations
    const recommendation = generateRecommendation({
      skin: skinAnalysis,
      skinTone,
      weather,
      vibe: (vibe as any) || 'classy',
      closet: closetItems,
      customLook,
    });

    // 6. Save intermediate look session
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
      customLook,
      engineSource,
      engineNotice,
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
